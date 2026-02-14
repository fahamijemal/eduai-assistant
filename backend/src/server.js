import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { connectDb } from './db/connect.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Resolve upload dir to absolute path (relative to backend root)
if (!path.isAbsolute(config.uploadDir)) {
  config.uploadDir = path.resolve(__dirname, '..', config.uploadDir);
}

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Global middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static files in production
if (config.nodeEnv === 'production') {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  await connectDb();
  app.listen(config.port, () => {
    console.log(`EduAI server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start();

export default app;
