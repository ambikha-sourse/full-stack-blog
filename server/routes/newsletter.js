import express from 'express';
import db from '../database.js';

const router = express.Router();

// POST /api/newsletter/subscribe
router.post('/subscribe', (req, res) => {
  try {
    const { email, topics = 'All Engineering & Architecture' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare(`SELECT id FROM subscribers WHERE email = ?`).get(cleanEmail);

    if (existing) {
      db.prepare(`UPDATE subscribers SET topics = ? WHERE email = ?`).run(
        Array.isArray(topics) ? topics.join(', ') : topics,
        cleanEmail
      );
      return res.json({ message: 'Your topic preferences have been updated!', email: cleanEmail });
    }

    db.prepare(`INSERT INTO subscribers (email, topics) VALUES (?, ?)`).run(
      cleanEmail,
      Array.isArray(topics) ? topics.join(', ') : topics
    );

    res.status(201).json({ message: 'Successfully subscribed to Action Digest!', email: cleanEmail });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

// GET /api/newsletter/subscribers - Admin list
router.get('/subscribers', (req, res) => {
  try {
    const subscribers = db.prepare(`SELECT * FROM subscribers ORDER BY created_at DESC`).all();
    res.json({ subscribers, count: subscribers.length });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// GET /api/newsletter/export - CSV export
router.get('/export', (req, res) => {
  try {
    const subscribers = db.prepare(`SELECT email, topics, created_at FROM subscribers ORDER BY created_at DESC`).all();
    let csv = 'Email,Topics,Subscribed At\n';
    subscribers.forEach(s => {
      csv += `"${s.email}","${s.topics}","${s.created_at}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pulse_subscribers.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting subscribers:', error);
    res.status(500).json({ error: 'Failed to export subscribers' });
  }
});

export default router;
