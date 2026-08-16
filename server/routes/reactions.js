import express from 'express';
import db from '../database.js';

const router = express.Router();

const VALID_REACTIONS = ['clap', 'insight', 'love', 'rocket'];

// GET /api/reactions/post/:postId
router.get('/post/:postId', (req, res) => {
  try {
    const { postId } = req.params;
    const userSession = req.headers['x-user-session'] || 'anonymous';

    const rows = db.prepare(`
      SELECT reaction_type, SUM(count) as total
      FROM reactions
      WHERE post_id = ?
      GROUP BY reaction_type
    `).all(postId);

    const totals = { clap: 0, insight: 0, love: 0, rocket: 0 };
    rows.forEach(r => {
      totals[r.reaction_type] = r.total;
    });

    const userReactions = db.prepare(`
      SELECT reaction_type, count FROM reactions WHERE post_id = ? AND user_session = ?
    `).all(postId, userSession);

    const userMap = {};
    userReactions.forEach(r => {
      userMap[r.reaction_type] = r.count;
    });

    res.json({ totals, userReactions: userMap });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    res.status(500).json({ error: 'Failed to fetch reactions' });
  }
});

// POST /api/reactions/toggle - Add reaction / clap
router.post('/toggle', (req, res) => {
  try {
    const { postId, reactionType, increment = 1 } = req.body;
    const userSession = req.headers['x-user-session'] || req.body.userSession || 'anonymous';

    if (!postId || !VALID_REACTIONS.includes(reactionType)) {
      return res.status(400).json({ error: 'Valid postId and reactionType (clap, insight, love, rocket) required' });
    }

    db.prepare(`
      INSERT INTO reactions (post_id, reaction_type, user_session, count, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(post_id, reaction_type, user_session) DO UPDATE SET
        count = count + excluded.count,
        updated_at = CURRENT_TIMESTAMP
    `).run(postId, reactionType, userSession, Number(increment) || 1);

    // Fetch updated totals
    const rows = db.prepare(`
      SELECT reaction_type, SUM(count) as total
      FROM reactions
      WHERE post_id = ?
      GROUP BY reaction_type
    `).all(postId);

    const totals = { clap: 0, insight: 0, love: 0, rocket: 0 };
    rows.forEach(r => {
      totals[r.reaction_type] = r.total;
    });

    const userReaction = db.prepare(`
      SELECT count FROM reactions WHERE post_id = ? AND reaction_type = ? AND user_session = ?
    `).get(postId, reactionType, userSession);

    res.json({
      postId,
      reactionType,
      totals,
      userCount: userReaction ? userReaction.count : 0
    });
  } catch (error) {
    console.error('Error recording reaction:', error);
    res.status(500).json({ error: 'Failed to record reaction' });
  }
});

export default router;
