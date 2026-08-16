import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  try {
    const totalPosts = db.prepare(`SELECT COUNT(*) as count FROM posts`).get().count;
    const publishedPosts = db.prepare(`SELECT COUNT(*) as count FROM posts WHERE is_published = 1`).get().count;
    const totalViews = db.prepare(`SELECT COALESCE(SUM(views), 0) as total FROM posts`).get().total;
    const totalReactions = db.prepare(`SELECT COALESCE(SUM(count), 0) as total FROM reactions`).get().total;
    const totalComments = db.prepare(`SELECT COUNT(*) as count FROM comments`).get().count;
    const totalSubscribers = db.prepare(`SELECT COUNT(*) as count FROM subscribers`).get().count;
    const totalActionItems = db.prepare(`SELECT COUNT(*) as count FROM action_items`).get().count;
    const completedActionItems = db.prepare(`SELECT COUNT(*) as count FROM action_progress WHERE is_completed = 1`).get().count;

    // Top performing posts
    const topPosts = db.prepare(`
      SELECT p.id, p.slug, p.title, p.category, p.views, p.created_at,
        (SELECT COALESCE(SUM(count), 0) FROM reactions r WHERE r.post_id = p.id) as reactions_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comments_count,
        (SELECT COUNT(*) FROM action_items a WHERE a.post_id = p.id) as action_items_count,
        (SELECT COUNT(*) FROM action_progress ap WHERE ap.post_id = p.id AND ap.is_completed = 1) as completed_actions_count
      FROM posts p
      ORDER BY p.views DESC
      LIMIT 6
    `).all();

    // Category breakdown
    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as post_count, SUM(views) as total_views
      FROM posts
      GROUP BY category
    `).all();

    // Recent activity log
    const recentComments = db.prepare(`
      SELECT c.*, p.title as post_title, p.slug as post_slug
      FROM comments c
      JOIN posts p ON p.id = c.post_id
      ORDER BY c.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      summary: {
        totalPosts,
        publishedPosts,
        totalViews,
        totalReactions,
        totalComments,
        totalSubscribers,
        totalActionItems,
        completedActionItems,
        actionCompletionRate: totalActionItems > 0 ? Math.round((completedActionItems / Math.max(1, totalActionItems * 10)) * 100) : 0
      },
      topPosts,
      categoryStats,
      recentComments
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
