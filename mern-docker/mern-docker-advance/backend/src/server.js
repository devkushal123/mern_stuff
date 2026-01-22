
import express from 'express';
import pinoHttp from 'pino-http';
import itemsRouter from './routes/items.routes.js';
import { security } from './middlewares/security.js';
import { notFound, errorHandler } from './middlewares/error.js';

export function createApp() {
  const app = express();

  // Logging
  app.use(pinoHttp({
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    autoLogging: true
  }));

  // Security
  const { helmet: helmetMw, cors: corsMw, limiter } = security({
    corsOrigin: process.env.CORS_ORIGIN || ''
  });
  app.use(helmetMw);
  app.use(limiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(corsMw);

  // Health endpoint (for Docker healthchecks)
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  // API routes
  app.use('/api/items', itemsRouter);

  // 404 + Error
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
