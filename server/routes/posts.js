import express from 'express';
import db from '../database.js';

const router = express.Router();

// Helper to calculate estimated read time from markdown content
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Generate URL slug from title
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '') + '-' + Date.now().toString().slice(-4);
}

// GET /api/posts - Get list of posts with filtering & search
router.get('/', (req, res) => {
  try {
    const { category, tag, search, difficulty, sort = 'latest', limit = 20, page = 1 } = req.query;
    const userSession = req.headers['x-user-session'] || 'anonymous';

    let query = `
      SELECT p.*,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COALESCE(SUM(count), 0) FROM reactions r WHERE r.post_id = p.id) as total_reactions,
        (SELECT COUNT(*) FROM action_items a WHERE a.post_id = p.id) as total_action_items,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.post_id = p.id AND b.user_session = ?) as is_bookmarked
      FROM posts p
      WHERE p.is_published = 1
    `;
    const params = [userSession];

    if (category && category !== 'All') {
      query += ` AND p.category = ?`;
      params.push(category);
    }

    if (difficulty && difficulty !== 'All') {
      query += ` AND p.difficulty = ?`;
      params.push(difficulty);
    }

    if (search) {
      query += ` AND (p.title LIKE ? OR p.subtitle LIKE ? OR p.content LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    if (tag) {
      query += ` AND p.id IN (SELECT post_id FROM post_tags WHERE tag = ?)`;
      params.push(tag);
    }

    // Sorting
    if (sort === 'popular') {
      query += ` ORDER BY p.views DESC, p.created_at DESC`;
    } else if (sort === 'trending') {
      query += ` ORDER BY total_reactions DESC, p.views DESC`;
    } else if (sort === 'actionable') {
      query += ` ORDER BY total_action_items DESC, p.created_at DESC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));

    const posts = db.prepare(query).all(...params);

    // Attach tags and action items count
    const getTagsStmt = db.prepare(`SELECT tag FROM post_tags WHERE post_id = ?`);
    const postsWithTags = posts.map(post => ({
      ...post,
      tags: getTagsStmt.all(post.id).map(t => t.tag),
      is_bookmarked: Boolean(post.is_bookmarked)
    }));

    // Categories summary
    const categories = db.prepare(`SELECT category, COUNT(*) as count FROM posts WHERE is_published = 1 GROUP BY category`).all();
    const tags = db.prepare(`SELECT tag, COUNT(*) as count FROM post_tags GROUP BY tag ORDER BY count DESC LIMIT 15`).all();

    res.json({
      posts: postsWithTags,
      categories,
      tags,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/featured
router.get('/featured', (req, res) => {
  try {
    const post = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COALESCE(SUM(count), 0) FROM reactions r WHERE r.post_id = p.id) as total_reactions,
        (SELECT COUNT(*) FROM action_items a WHERE a.post_id = p.id) as total_action_items
      FROM posts p
      WHERE p.is_featured = 1 AND p.is_published = 1
      ORDER BY p.created_at DESC
      LIMIT 1
    `).get();

    if (!post) {
      return res.status(404).json({ error: 'No featured post found' });
    }

    const tags = db.prepare(`SELECT tag FROM post_tags WHERE post_id = ?`).all(post.id).map(t => t.tag);
    res.json({ ...post, tags });
  } catch (error) {
    console.error('Error fetching featured post:', error);
    res.status(500).json({ error: 'Failed to fetch featured post' });
  }
});

// GET /api/posts/:slug - Get post by slug
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const userSession = req.headers['x-user-session'] || 'anonymous';

    const post = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM bookmarks b WHERE b.post_id = p.id AND b.user_session = ?) as is_bookmarked
      FROM posts p
      WHERE p.slug = ? OR p.id = ?
    `).get(userSession, slug, Number(slug) || 0);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Increment view count
    db.prepare(`UPDATE posts SET views = views + 1 WHERE id = ?`).run(post.id);
    post.views += 1;

    // Fetch tags
    const tags = db.prepare(`SELECT tag FROM post_tags WHERE post_id = ?`).all(post.id).map(t => t.tag);

    // Fetch action items with user progress
    const actionItems = db.prepare(`
      SELECT a.*,
        COALESCE((SELECT is_completed FROM action_progress ap WHERE ap.action_id = a.id AND ap.user_session = ?), 0) as is_completed
      FROM action_items a
      WHERE a.post_id = ?
      ORDER BY a.step_number ASC
    `).all(userSession, post.id);

    // Fetch embedded poll
    const poll = db.prepare(`SELECT * FROM polls WHERE post_id = ?`).get(post.id);
    let pollData = null;
    if (poll) {
      const options = db.prepare(`SELECT * FROM poll_options WHERE poll_id = ?`).all(poll.id);
      const userVote = db.prepare(`SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_session = ?`).get(poll.id, userSession);
      const totalVotes = options.reduce((sum, o) => sum + (o.votes_count || 0), 0);

      pollData = {
        id: poll.id,
        question: poll.question,
        options: options.map(opt => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0
        })),
        totalVotes,
        hasVoted: Boolean(userVote),
        userVotedOptionId: userVote ? userVote.option_id : null
      };
    }

    // Fetch reactions breakdown
    const reactionRows = db.prepare(`
      SELECT reaction_type, SUM(count) as total
      FROM reactions
      WHERE post_id = ?
      GROUP BY reaction_type
    `).all(post.id);

    const reactions = {
      clap: 0,
      insight: 0,
      love: 0,
      rocket: 0
    };
    reactionRows.forEach(r => {
      reactions[r.reaction_type] = r.total;
    });

    const userReactions = db.prepare(`
      SELECT reaction_type FROM reactions WHERE post_id = ? AND user_session = ?
    `).all(post.id, userSession).map(r => r.reaction_type);

    // Related posts
    const relatedPosts = db.prepare(`
      SELECT id, slug, title, cover_image, category, read_time_minutes, created_at
      FROM posts
      WHERE category = ? AND id != ? AND is_published = 1
      LIMIT 3
    `).all(post.category, post.id);

    res.json({
      ...post,
      is_bookmarked: Boolean(post.is_bookmarked),
      tags,
      actionItems: actionItems.map(a => ({ ...a, is_completed: Boolean(a.is_completed) })),
      poll: pollData,
      reactions,
      userReactions,
      relatedPosts
    });
  } catch (error) {
    console.error('Error fetching post detail:', error);
    res.status(500).json({ error: 'Failed to fetch post details' });
  }
});

// POST /api/posts - Create a new post
router.post('/', (req, res) => {
  try {
    const {
      title,
      subtitle,
      content,
      category = 'Engineering & Architecture',
      cover_image,
      author_name = 'Alex Vance',
      author_role = 'Staff Engineer',
      author_avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      difficulty = 'Intermediate',
      is_featured = 0,
      is_published = 1,
      tags = [],
      action_items = [],
      poll = null
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const slug = slugify(title);
    const read_time_minutes = calculateReadTime(content);

    const insert = db.prepare(`
      INSERT INTO posts (slug, title, subtitle, content, category, cover_image, author_name, author_role, author_avatar, read_time_minutes, is_featured, is_published, difficulty)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      slug,
      title,
      subtitle || '',
      content,
      category,
      cover_image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80',
      author_name,
      author_role,
      author_avatar,
      read_time_minutes,
      is_featured ? 1 : 0,
      is_published ? 1 : 0,
      difficulty
    );

    const postId = result.lastInsertRowid;

    // Insert tags
    if (Array.isArray(tags)) {
      const insertTag = db.prepare(`INSERT INTO post_tags (post_id, tag) VALUES (?, ?)`);
      tags.forEach(t => {
        if (t && t.trim()) insertTag.run(postId, t.trim());
      });
    }

    // Insert action items
    if (Array.isArray(action_items) && action_items.length > 0) {
      const insertAction = db.prepare(`
        INSERT INTO action_items (post_id, step_number, title, description, code_snippet, resource_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      action_items.forEach((item, idx) => {
        if (item.title && item.title.trim()) {
          insertAction.run(
            postId,
            idx + 1,
            item.title.trim(),
            item.description || '',
            item.code_snippet || '',
            item.resource_url || ''
          );
        }
      });
    }

    // Insert Poll if provided
    if (poll && poll.question && Array.isArray(poll.options) && poll.options.length >= 2) {
      const insertPoll = db.prepare(`INSERT INTO polls (post_id, question) VALUES (?, ?)`);
      const pollRes = insertPoll.run(postId, poll.question.trim());
      const pollId = pollRes.lastInsertRowid;

      const insertOpt = db.prepare(`INSERT INTO poll_options (poll_id, option_text, votes_count) VALUES (?, ?, 0)`);
      poll.options.forEach(opt => {
        if (opt && opt.trim()) insertOpt.run(pollId, opt.trim());
      });
    }

    res.status(201).json({ id: postId, slug, message: 'Post created successfully' });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/posts/:id - Update existing post
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      content,
      category,
      cover_image,
      difficulty,
      is_featured,
      is_published,
      tags = [],
      action_items = []
    } = req.body;

    const read_time_minutes = content ? calculateReadTime(content) : 5;

    db.prepare(`
      UPDATE posts
      SET title = COALESCE(?, title),
          subtitle = COALESCE(?, subtitle),
          content = COALESCE(?, content),
          category = COALESCE(?, category),
          cover_image = COALESCE(?, cover_image),
          difficulty = COALESCE(?, difficulty),
          is_featured = COALESCE(?, is_featured),
          is_published = COALESCE(?, is_published),
          read_time_minutes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      subtitle,
      content,
      category,
      cover_image,
      difficulty,
      is_featured !== undefined ? (is_featured ? 1 : 0) : null,
      is_published !== undefined ? (is_published ? 1 : 0) : null,
      read_time_minutes,
      id
    );

    // Update tags if provided
    if (Array.isArray(tags)) {
      db.prepare(`DELETE FROM post_tags WHERE post_id = ?`).run(id);
      const insertTag = db.prepare(`INSERT INTO post_tags (post_id, tag) VALUES (?, ?)`);
      tags.forEach(t => {
        if (t && t.trim()) insertTag.run(id, t.trim());
      });
    }

    // Update action items if provided
    if (Array.isArray(action_items)) {
      db.prepare(`DELETE FROM action_items WHERE post_id = ?`).run(id);
      const insertAction = db.prepare(`
        INSERT INTO action_items (post_id, step_number, title, description, code_snippet, resource_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      action_items.forEach((item, idx) => {
        if (item.title && item.title.trim()) {
          insertAction.run(
            id,
            idx + 1,
            item.title.trim(),
            item.description || '',
            item.code_snippet || '',
            item.resource_url || ''
          );
        }
      });
    }

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`DELETE FROM posts WHERE id = ?`).run(id);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
