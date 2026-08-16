import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'pulse_blog.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      cover_image TEXT,
      author_name TEXT DEFAULT 'Alex Vance',
      author_role TEXT DEFAULT 'Staff Engineer & Tech Lead',
      author_avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      read_time_minutes INTEGER DEFAULT 5,
      is_featured INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      difficulty TEXT DEFAULT 'Intermediate',
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS post_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS action_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      code_snippet TEXT,
      resource_url TEXT,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS action_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_session TEXT NOT NULL,
      action_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      is_completed INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(action_id) REFERENCES action_items(id) ON DELETE CASCADE,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(user_session, action_id)
    );

    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      votes_count INTEGER DEFAULT 0,
      FOREIGN KEY(poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_id INTEGER NOT NULL,
      user_session TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(poll_id, user_session)
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      reaction_type TEXT NOT NULL,
      user_session TEXT NOT NULL,
      count INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(post_id, reaction_type, user_session)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      parent_id INTEGER NULL,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_session TEXT NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(user_session, post_id)
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      topics TEXT DEFAULT 'All Engineering & Architecture',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed initial rich data if empty
  const count = db.prepare('SELECT COUNT(*) as total FROM posts').get().total;
  if (count === 0) {
    seedDatabase();
  }
}

function seedDatabase() {
  console.log('Seeding initial rich actionable posts...');

  const insertPost = db.prepare(`
    INSERT INTO posts (slug, title, subtitle, content, category, cover_image, author_name, author_role, author_avatar, read_time_minutes, is_featured, is_published, difficulty, views, created_at)
    VALUES (@slug, @title, @subtitle, @content, @category, @cover_image, @author_name, @author_role, @author_avatar, @read_time_minutes, @is_featured, @is_published, @difficulty, @views, @created_at)
  `);

  const insertTag = db.prepare(`INSERT INTO post_tags (post_id, tag) VALUES (?, ?)`);
  const insertAction = db.prepare(`INSERT INTO action_items (post_id, step_number, title, description, code_snippet, resource_url) VALUES (?, ?, ?, ?, ?, ?)`);
  const insertPoll = db.prepare(`INSERT INTO polls (post_id, question) VALUES (?, ?)`);
  const insertOption = db.prepare(`INSERT INTO poll_options (poll_id, option_text, votes_count) VALUES (?, ?, ?)`);
  const insertComment = db.prepare(`INSERT INTO comments (post_id, parent_id, author_name, author_avatar, content, upvotes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertReaction = db.prepare(`INSERT INTO reactions (post_id, reaction_type, user_session, count) VALUES (?, ?, ?, ?)`);

  // Post 1: Building High-Throughput Node.js Microservices
  const post1Content = `
## Introduction

Scaling a Node.js microservice architecture to support high concurrent throughput requires more than just clustering or spinning up Kubernetes pods. When traffic surges into tens of thousands of requests per second, the real performance boundaries emerge in:

1. **V8 Event Loop saturation** and asynchronous scheduling lag.
2. **TCP socket exhaustion** due to unoptimized HTTP connection handling.
3. **Cascading failures** across distributed dependencies.

In this practical blueprint, we break down actionable patterns you can measure and implement directly in your codebase.

---

### Step 1: Diagnosing the Event Loop

Before tuning any code, measure your actual event loop delay rather than relying on CPU percentages. A service might only be consuming 30% CPU while the event loop delay spikes past 200ms due to synchronous JSON parsing or regex backtracking.

\`\`\`javascript
import { monitorEventLoopDelay } from 'perf_hooks';

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

// Log 50th, 90th, and 99th percentile event loop lag in ms
setInterval(() => {
  console.log({
    p50: (histogram.percentile(50) / 1e6).toFixed(2) + 'ms',
    p90: (histogram.percentile(90) / 1e6).toFixed(2) + 'ms',
    p99: (histogram.percentile(99) / 1e6).toFixed(2) + 'ms',
  });
  histogram.reset();
}, 5000);
\`\`\`

> 💡 **Actionable Rule:** If your p99 event loop lag exceeds 50ms, offload CPU-intensive operations (image processing, large schema validations, crypto) to worker threads or native C++ addons.

---

### Step 2: Connection Pooling & Keep-Alive Tuning

By default, Node's default global agent creates a new TCP socket per outgoing request unless \`keepAlive: true\` is explicitly enabled. This triggers TCP handshakes and TLS renegotiations on every single microservice-to-microservice RPC.

\`\`\`javascript
import http from 'http';
import https from 'https';

export const optimizedHttpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 150,
  maxFreeSockets: 50,
  timeout: 60000, // 60s
  keepAliveMsecs: 30000,
});

export const optimizedHttpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 150,
  maxFreeSockets: 50,
  timeout: 60000,
  keepAliveMsecs: 30000,
});
\`\`\`

---

### Step 3: Resilient Fallbacks with Circuit Breakers

When a downstream billing or inventory service suffers high latency, incoming requests will accumulate and exhaust your own memory. Wrapping external calls in a circuit breaker ensures fast fails and protects upstream clients:

\`\`\`javascript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 3000, // If function takes longer than 3s, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip breaker
  resetTimeout: 10000 // After 10s, attempt recovery
};

const breaker = new CircuitBreaker(callPaymentGateway, options);

breaker.fallback(() => ({ status: 'PENDING_RETRY', reason: 'Service degraded' }));
breaker.on('open', () => console.warn('Payment circuit opened!'));
\`\`\`

---

### Summary Checklist

Follow the interactive checklist in the sidebar or below to implement and verify these optimizations in your next sprint!
`;

  const post1 = insertPost.run({
    slug: 'architecting-high-throughput-node-microservices',
    title: 'Architecting High-Throughput Node.js Microservices: A Production Blueprint',
    subtitle: 'Step-by-step strategies for scaling event-driven microservices to handle 100k+ req/sec with zero downtime.',
    content: post1Content,
    category: 'Engineering & Architecture',
    cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Elena Rostova',
    author_role: 'Principal Systems Architect @ CloudScale',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    read_time_minutes: 8,
    is_featured: 1,
    is_published: 1,
    difficulty: 'Advanced',
    views: 1420,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
  });
  const p1Id = post1.lastInsertRowid;

  ['Node.js', 'Microservices', 'Distributed Systems', 'Performance', 'Redis'].forEach(tag => insertTag.run(p1Id, tag));

  insertAction.run(p1Id, 1, 'Audit Thread Pool & Event Loop Bottlenecks', 'Benchmark event loop lag using the perf_hooks monitorEventLoopDelay API under load.', 'const { monitorEventLoopDelay } = require("perf_hooks");\nconst h = monitorEventLoopDelay({ resolution: 20 });\nh.enable();\n// Check p99 lag in milliseconds\nconsole.log(h.percentile(99) / 1e6);', 'https://nodejs.org/api/perf_hooks.html');
  insertAction.run(p1Id, 2, 'Implement Connection Pooling & Keep-Alive', 'Configure Node http.Agent with maxSockets and keepAlive to reuse TCP connections.', 'const http = require("http");\nconst agent = new http.Agent({ keepAlive: true, maxSockets: 100, keepAliveMsecs: 30000 });', null);
  insertAction.run(p1Id, 3, 'Deploy Redis Distributed Caching with Read-Through', 'Prevent database thundering herds using singleflight or dogpile locks on cache miss.', 'const cached = await redis.get(cacheKey);\nif (!cached) {\n  const data = await fetchFromDB();\n  await redis.set(cacheKey, JSON.stringify(data), "EX", 300);\n}', null);
  insertAction.run(p1Id, 4, 'Set Up Circuit Breakers with Cockatiel or Opossum', 'Gracefully degrade downstream dependency failures with automated fallbacks.', 'const circuitBreaker = new CircuitBreaker(fetchUserOrders, { timeout: 3000, errorThresholdPercentage: 50 });', 'https://github.com/nodeshift/opossum');

  const poll1 = insertPoll.run(p1Id, 'What is your primary bottleneck when scaling Node.js in production?');
  insertOption.run(poll1.lastInsertRowid, 'Event loop blocking / CPU intensive tasks', 48);
  insertOption.run(poll1.lastInsertRowid, 'Database connection limits & slow queries', 92);
  insertOption.run(poll1.lastInsertRowid, 'Downstream API latencies & cascade timeouts', 35);
  insertOption.run(poll1.lastInsertRowid, 'Memory leaks & V8 garbage collection spikes', 27);

  const c1 = insertComment.run(p1Id, null, 'Marcus Brody', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', 'The connection pooling tip alone saved us 40% latency on our internal gateway. Great actionable checklist!', 14, new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString());
  insertComment.run(p1Id, c1.lastInsertRowid, 'Elena Rostova', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Glad it helped Marcus! Make sure you also tune the OS-level TCP backlog queues if your ingress traffic spikes suddenly.', 6, new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString());

  insertReaction.run(p1Id, 'clap', 'seed-user-1', 42);
  insertReaction.run(p1Id, 'insight', 'seed-user-2', 18);
  insertReaction.run(p1Id, 'rocket', 'seed-user-3', 25);

  // Post 2: Building Modern AI Agents
  const post2Content = `
## Why Function Calling Changes Everything

Modern Language Models are no longer confined to answering text prompts in a vacuum. With native **Tool Calling** (Function Calling), models act as reasoning engines capable of:

- Querying live databases and REST endpoints.
- Executing code and inspecting output.
- Orchestrating multi-step workflows with real-world side effects.

However, naive implementations frequently get trapped in infinite loops or hallucinate tool parameters. Let's look at how to build rock-solid agents.

---

### Step 1: Strict Tool Schemas

To minimize parameter hallucinations, every tool must have explicit JSON Schema validation.

\`\`\`typescript
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export const searchDatabaseTool: ToolDefinition = {
  name: 'search_database',
  description: 'Search customer orders by query and date range',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term for items or customer name' },
      status: { type: 'string', enum: ['pending', 'shipped', 'cancelled'], description: 'Order status filter' },
      limit: { type: 'number', description: 'Maximum results to return (1-50)' }
    },
    required: ['query']
  }
};
\`\`\`

---

### Step 2: The Resilient Execution Loop

Always wrap your agent's execution in a step-bounded loop with deterministic error recovery:

\`\`\`typescript
async function runAgentTask(userPrompt: string, availableTools: Map<string, Function>) {
  const messages = [{ role: 'user', content: userPrompt }];
  let steps = 0;
  const MAX_STEPS = 10;

  while (steps++ < MAX_STEPS) {
    const response = await model.generate({ messages, tools: [...availableTools.values()] });

    if (!response.toolCalls || response.toolCalls.length === 0) {
      return response.content; // Task finished!
    }

    for (const toolCall of response.toolCalls) {
      const toolFn = availableTools.get(toolCall.name);
      try {
        const result = await toolFn(toolCall.args);
        messages.push({
          role: 'tool',
          toolCallId: toolCall.id,
          content: JSON.stringify(result)
        });
      } catch (err) {
        messages.push({
          role: 'tool',
          toolCallId: toolCall.id,
          content: JSON.stringify({ error: err.message, retryable: true })
        });
      }
    }
  }

  throw new Error('Agent reached maximum step limit without resolving task.');
}
\`\`\`

---

### Key Takeaway

Always provide structured feedback back to the LLM on tool failure rather than throwing an exception. Models are surprisingly good at correcting their own query typos when given the error output!
`;

  const post2 = insertPost.run({
    slug: 'building-autonomous-ai-agents-with-tool-calling',
    title: 'Building Autonomous AI Agents with Tool Calling: Complete Guide',
    subtitle: 'How to structure agentic workflows with schema-validated tools, dynamic memory stores, and self-correction loops.',
    content: post2Content,
    category: 'AI & Machine Learning',
    cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Daria Chen',
    author_role: 'Lead AI Engineer @ NeuralWorks',
    author_avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    read_time_minutes: 7,
    is_featured: 1,
    is_published: 1,
    difficulty: 'Intermediate',
    views: 2890,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
  });
  const p2Id = post2.lastInsertRowid;

  ['AI', 'LLM', 'Agents', 'Tool Calling', 'TypeScript', 'Python'].forEach(tag => insertTag.run(p2Id, tag));

  insertAction.run(p2Id, 1, 'Define Strict JSON Schema for Tool Definitions', 'Ensure LLM receives clear parameter descriptions, enums, and required properties.', 'const weatherTool = {\n  name: "get_weather",\n  description: "Get current weather for location",\n  parameters: {\n    type: "object",\n    properties: { location: { type: "string" } },\n    required: ["location"]\n  }\n};', null);
  insertAction.run(p2Id, 2, 'Build Loop Termination & Safeguard Limits', 'Add max iteration counters (e.g. max 8 steps) to prevent endless recursive loops.', 'const MAX_STEPS = 8;\nwhile (stepCount++ < MAX_STEPS && !isFinalAnswer) { ... }', null);
  insertAction.run(p2Id, 3, 'Implement Scratchpad & Memory Windowing', 'Summarize or prune old conversation tokens to stay within model context bounds.', null, 'https://github.com/anthropics/anthropic-cookbook');

  const poll2 = insertPoll.run(p2Id, 'Which LLM orchestration pattern do you find most reliable?');
  insertOption.run(poll2.lastInsertRowid, 'ReAct / Single Agent with Loop', 76);
  insertOption.run(poll2.lastInsertRowid, 'Multi-Agent Supervisor & Workers', 64);
  insertOption.run(poll2.lastInsertRowid, 'Deterministic State Machine (LangGraph style)', 118);
  insertOption.run(poll2.lastInsertRowid, 'Simple Chain / Plan-and-Solve', 21);

  insertComment.run(p2Id, null, 'Sarah Jenkins', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', 'The emphasis on loop termination safeguards is super crucial. We once had an agent burn $400 in API tokens looping on a 404 response!', 22, new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString());

  insertReaction.run(p2Id, 'clap', 'seed-user-1', 65);
  insertReaction.run(p2Id, 'love', 'seed-user-4', 38);
  insertReaction.run(p2Id, 'rocket', 'seed-user-5', 51);

  // Post 3: CSS Modern Architecture & Glassmorphism
  const post3Content = `
## Modern CSS in 2026

Modern CSS has evolved into a powerhouse. With native features like **container queries**, **color-mix()**, **subgrid**, and **backdrop-filter**, you can build stunning glassmorphic user interfaces without hundreds of utility classes.

### The Anatomy of High-End Glassmorphism

To achieve realistic, high-end frosted glass rather than a cheap gray box:

1. Use multi-layer translucent backgrounds.
2. Add a sub-pixel border highlight with an angled gradient.
3. Use high-performance hardware-accelerated \`backdrop-filter: blur()\`.

\`\`\`css
.glass-panel {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.07) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px 0 rgba(0, 0, 0, 0.37),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.2);
}
\`\`\`

Try implementing this directly in your components to give your app a sleek, futuristic aesthetic!
`;

  const post3 = insertPost.run({
    slug: 'crafting-next-gen-ui-modern-css-and-glassmorphism',
    title: 'Crafting Next-Gen UIs: Modern CSS Tokens & Fluid Glassmorphism',
    subtitle: 'Mastering CSS variables, backdrop filters, container queries, and micro-interactions without bloated frameworks.',
    content: post3Content,
    category: 'UI/UX & Design',
    cover_image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Kai Takahashi',
    author_role: 'Design Engineer @ StudioVibe',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    read_time_minutes: 5,
    is_featured: 0,
    is_published: 1,
    difficulty: 'Beginner',
    views: 940,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
  });
  const p3Id = post3.lastInsertRowid;

  ['CSS', 'Design Systems', 'Glassmorphism', 'Web Design', 'Frontend'].forEach(tag => insertTag.run(p3Id, tag));

  insertAction.run(p3Id, 1, 'Set Up Fluid Typography with CSS Clamp', 'Replace breakpoint text jumps with dynamic font sizing across viewport widths.', 'h1 {\n  font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);\n}', null);
  insertAction.run(p3Id, 2, 'Create Glassmorphic Surface Utility', 'Combine backdrop-filter blur with semi-transparent border highlights.', '.glass-card {\n  background: rgba(255, 255, 255, 0.05);\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(255, 255, 255, 0.12);\n}', null);

  const poll3 = insertPoll.run(p3Id, 'What is your preferred method for styling modern web apps in 2026?');
  insertOption.run(poll3.lastInsertRowid, 'Modern Vanilla CSS & Custom Design Systems', 83);
  insertOption.run(poll3.lastInsertRowid, 'Tailwind CSS', 112);
  insertOption.run(poll3.lastInsertRowid, 'CSS Modules / Styled Components', 39);

  insertReaction.run(p3Id, 'love', 'seed-user-2', 49);
  insertReaction.run(p3Id, 'clap', 'seed-user-3', 31);

  // Post 4: Database Indexing Secrets
  const post4Content = `
## The Indexing Rule: Equality First, Range Second

When designing composite indexes for SQL databases (PostgreSQL, MySQL, SQLite), the order of columns matters immensely.

If your query is:
\`\`\`sql
SELECT * FROM users 
WHERE tenant_id = 42 AND active = 1 
ORDER BY last_login_at DESC 
LIMIT 20;
\`\`\`

The optimal index order is:
\`\`\`sql
CREATE INDEX idx_users_lookup ON users(tenant_id, active, last_login_at DESC);
\`\`\`

Putting the range or sorting column (\`last_login_at\`) before the equality columns will prevent the database engine from seeking directly to the matching bucket, triggering costly filter scans.
`;

  const post4 = insertPost.run({
    slug: 'database-indexing-masterclass-sql-optimization',
    title: 'Database Indexing Masterclass: Finding and Eliminating Slow Queries',
    subtitle: 'Understanding B-Trees, composite index column ordering, and EXPLAIN ANALYZE to boost query speeds by 50x.',
    content: post4Content,
    category: 'Engineering & Architecture',
    cover_image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&auto=format&fit=crop&q=80',
    author_name: 'Elena Rostova',
    author_role: 'Principal Systems Architect @ CloudScale',
    author_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    read_time_minutes: 6,
    is_featured: 0,
    is_published: 1,
    difficulty: 'Intermediate',
    views: 1105,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
  });
  const p4Id = post4.lastInsertRowid;
  ['SQL', 'PostgreSQL', 'SQLite', 'Database', 'Performance'].forEach(tag => insertTag.run(p4Id, tag));

  insertAction.run(p4Id, 1, 'Run EXPLAIN QUERY PLAN on Top 5 Slow Queries', 'Identify table scans and verify index hits.', 'EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = "pending" ORDER BY created_at DESC;', null);
  insertAction.run(p4Id, 2, 'Apply Left-to-Right Equality-First Composite Indexing', 'Create composite indexes with equality columns first, followed by range/sort columns.', 'CREATE INDEX idx_orders_status_date ON orders(status, created_at DESC);', null);

  insertReaction.run(p4Id, 'insight', 'seed-user-1', 40);
  insertReaction.run(p4Id, 'clap', 'seed-user-2', 29);

  // Seed initial subscribers
  const insertSub = db.prepare(`INSERT OR IGNORE INTO subscribers (email, topics) VALUES (?, ?)`);
  insertSub.run('dev.lead@example.com', 'Engineering & Architecture, AI & Machine Learning');
  insertSub.run('architect@techcorp.io', 'All Engineering & Architecture');
  insertSub.run('frontend.ninja@webstudio.dev', 'UI/UX & Design');

  console.log('Seeding complete! Database ready.');
}

export default db;
