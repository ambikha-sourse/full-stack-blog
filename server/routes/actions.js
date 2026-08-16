import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/actions/post/:postId - Get actions for a post with session completion status
router.get('/post/:postId', (req, res) => {
  try {
    const { postId } = req.params;
    const userSession = req.headers['x-user-session'] || req.query.userSession || 'anonymous';

    const items = db.prepare(`
      SELECT a.*,
        COALESCE((SELECT is_completed FROM action_progress ap WHERE ap.action_id = a.id AND ap.user_session = ?), 0) as is_completed
      FROM action_items a
      WHERE a.post_id = ?
      ORDER BY a.step_number ASC
    `).all(userSession, postId);

    const total = items.length;
    const completedCount = items.filter(i => i.is_completed).length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    res.json({
      items: items.map(i => ({ ...i, is_completed: Boolean(i.is_completed) })),
      total,
      completedCount,
      progressPercent
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
});

// POST /api/actions/toggle - Toggle action completion state
router.post('/toggle', (req, res) => {
  try {
    const { actionId, postId, isCompleted } = req.body;
    const userSession = req.headers['x-user-session'] || req.body.userSession || 'anonymous';

    if (!actionId || !postId) {
      return res.status(400).json({ error: 'actionId and postId are required' });
    }

    const state = isCompleted ? 1 : 0;

    // Upsert into action_progress
    db.prepare(`
      INSERT INTO action_progress (user_session, action_id, post_id, is_completed, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_session, action_id) DO UPDATE SET
        is_completed = excluded.is_completed,
        updated_at = CURRENT_TIMESTAMP
    `).run(userSession, actionId, postId, state);

    // Calculate updated progress
    const items = db.prepare(`
      SELECT a.id,
        COALESCE((SELECT is_completed FROM action_progress ap WHERE ap.action_id = a.id AND ap.user_session = ?), 0) as is_completed
      FROM action_items a
      WHERE a.post_id = ?
    `).all(userSession, postId);

    const total = items.length;
    const completedCount = items.filter(i => i.is_completed).length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    res.json({
      actionId,
      isCompleted: Boolean(state),
      total,
      completedCount,
      progressPercent,
      allCompleted: total > 0 && completedCount === total
    });
  } catch (error) {
    console.error('Error toggling action item:', error);
    res.status(500).json({ error: 'Failed to toggle action item' });
  }
});

export default router;
