import express from 'express';
import db from '../database.js';

const router = express.Router();

// GET /api/polls/post/:postId
router.get('/post/:postId', (req, res) => {
  try {
    const { postId } = req.params;
    const userSession = req.headers['x-user-session'] || 'anonymous';

    const poll = db.prepare(`SELECT * FROM polls WHERE post_id = ?`).get(postId);
    if (!poll) {
      return res.json({ poll: null });
    }

    const options = db.prepare(`SELECT * FROM poll_options WHERE poll_id = ?`).all(poll.id);
    const userVote = db.prepare(`SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_session = ?`).get(poll.id, userSession);
    const totalVotes = options.reduce((sum, o) => sum + (o.votes_count || 0), 0);

    res.json({
      poll: {
        id: poll.id,
        question: poll.question,
        options: options.map(opt => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0
        })),
        totalVotes,
        hasVoted: Boolean(userVote),
        userVotedOptionId: userVote ? userVote.option_id : null
      }
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// POST /api/polls/vote - Vote on a poll option
router.post('/vote', (req, res) => {
  try {
    const { pollId, optionId } = req.body;
    const userSession = req.headers['x-user-session'] || req.body.userSession || 'anonymous';

    if (!pollId || !optionId) {
      return res.status(400).json({ error: 'pollId and optionId are required' });
    }

    // Check if user already voted
    const existingVote = db.prepare(`SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_session = ?`).get(pollId, userSession);

    if (existingVote) {
      if (existingVote.option_id === optionId) {
        // Already voted this option, return current results
      } else {
        // Change vote: decrement previous option, increment new
        db.transaction(() => {
          db.prepare(`UPDATE poll_options SET votes_count = MAX(0, votes_count - 1) WHERE id = ?`).run(existingVote.option_id);
          db.prepare(`UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = ?`).run(optionId);
          db.prepare(`UPDATE poll_votes SET option_id = ?, created_at = CURRENT_TIMESTAMP WHERE poll_id = ? AND user_session = ?`).run(optionId, pollId, userSession);
        })();
      }
    } else {
      // First time vote
      db.transaction(() => {
        db.prepare(`INSERT INTO poll_votes (poll_id, option_id, user_session) VALUES (?, ?, ?)`).run(pollId, optionId, userSession);
        db.prepare(`UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = ?`).run(optionId);
      })();
    }

    // Return updated poll data
    const poll = db.prepare(`SELECT * FROM polls WHERE id = ?`).get(pollId);
    const options = db.prepare(`SELECT * FROM poll_options WHERE poll_id = ?`).all(pollId);
    const totalVotes = options.reduce((sum, o) => sum + (o.votes_count || 0), 0);

    res.json({
      success: true,
      poll: {
        id: poll.id,
        question: poll.question,
        options: options.map(opt => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0
        })),
        totalVotes,
        hasVoted: true,
        userVotedOptionId: optionId
      }
    });
  } catch (error) {
    console.error('Error recording vote:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

export default router;
