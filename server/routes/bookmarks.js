import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/bookmarks - Get bookmarked posts for user session
router.get('/', (req, res) => {
  try {
    const userSession = req.headers['x-user-session'] || req.query.userSession || 'anonymous';

    const posts = db.prepare(`
      SELECT p.*,
        b.created_at as bookmarked_at,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COALESCE(SUM(count), 0) FROM reactions r WHERE r.post_id = p.id) as total_reactions,
        (SELECT COUNT(*) FROM action_items a WHERE a.post_id = p.id) as total_action_items,
        (SELECT COUNT(*) FROM action_progress ap WHERE ap.post_id = p.id AND ap.user_session = ? AND ap.is_completed = 1) as completed_action_items
      FROM bookmarks b
      JOIN posts p ON p.id = b.post_id
      WHERE b.user_session = ?
      ORDER BY b.created_at DESC
    `).all(userSession, userSession);

    const getTags = db.prepare(`SELECT tag FROM post_tags WHERE post_id = ?`);
    const results = posts.map(p => ({
      ...p,
      is_bookmarked: true,
      tags: getTags.all(p.id).map(t => t.tag)
    }));

    res.json({ bookmarks: results, count: results.length });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// POST /api/bookmarks/toggle - Toggle bookmark
router.post('/toggle', (req, res) => {
  try {
    const { postId } = req.body;
    const userSession = req.headers['x-user-session'] || req.body.userSession || 'anonymous';

    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    const existing = db.prepare(`SELECT id FROM bookmarks WHERE post_id = ? AND user_session = ?`).get(postId, userSession);

    let isBookmarked = false;
    if (existing) {
      db.prepare(`DELETE FROM bookmarks WHERE id = ?`).run(existing.id);
      isBookmarked = false;
    } else {
      db.prepare(`INSERT INTO bookmarks (user_session, post_id) VALUES (?, ?)`).run(userSession, postId);
      isBookmarked = true;
    }

    const totalBookmarks = db.prepare(`SELECT COUNT(*) as count FROM bookmarks WHERE user_session = ?`).get(userSession).count;

    res.json({
      postId: Number(postId),
      isBookmarked,
      totalBookmarks
    });
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

export default router;
