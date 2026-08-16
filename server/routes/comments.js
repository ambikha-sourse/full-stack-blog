import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/comments/post/:postId - Get threaded comments
router.get('/post/:postId', (req, res) => {
  try {
    const { postId } = req.params;
    const comments = db.prepare(`
      SELECT * FROM comments
      WHERE post_id = ?
      ORDER BY created_at ASC
    `).all(postId);

    // Build hierarchy
    const map = {};
    const rootComments = [];

    comments.forEach(c => {
      map[c.id] = { ...c, replies: [] };
    });

    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c.id]);
      } else {
        rootComments.push(map[c.id]);
      }
    });

    res.json({ comments: rootComments, totalCount: comments.length });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/comments - Create a new comment or reply
router.post('/', (req, res) => {
  try {
    const { postId, parentId = null, authorName = 'Anonymous Dev', authorAvatar, content } = req.body;

    if (!postId || !content || !content.trim()) {
      return res.status(400).json({ error: 'postId and content are required' });
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(authorName)}`;

    const insert = db.prepare(`
      INSERT INTO comments (post_id, parent_id, author_name, author_avatar, content, upvotes, created_at)
      VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `);

    const result = insert.run(
      postId,
      parentId || null,
      authorName.trim(),
      authorAvatar || defaultAvatar,
      content.trim()
    );

    const newComment = db.prepare(`SELECT * FROM comments WHERE id = ?`).get(result.lastInsertRowid);

    res.status(201).json({ comment: { ...newComment, replies: [] } });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// POST /api/comments/:id/upvote - Upvote a comment
router.post('/:id/upvote', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare(`UPDATE comments SET upvotes = upvotes + 1 WHERE id = ?`).run(id);
    const comment = db.prepare(`SELECT upvotes FROM comments WHERE id = ?`).get(id);

    res.json({ id: Number(id), upvotes: comment ? comment.upvotes : 0 });
  } catch (error) {
    console.error('Error upvoting comment:', error);
    res.status(500).json({ error: 'Failed to upvote comment' });
  }
});

export default router;
