import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database.js';
import postsRouter from './routes/posts.js';
import actionsRouter from './routes/actions.js';
import pollsRouter from './routes/polls.js';
import commentsRouter from './routes/comments.js';
import reactionsRouter from './routes/reactions.js';
import bookmarksRouter from './routes/bookmarks.js';
import newsletterRouter from './routes/newsletter.js';
import analyticsRouter from './routes/analytics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database and tables
initDatabase();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/posts', postsRouter);
app.use('/api/actions', actionsRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/reactions', reactionsRouter);
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/analytics', analyticsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PulseBlog API',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PulseBlog API Server running at http://localhost:${PORT}`);
});
