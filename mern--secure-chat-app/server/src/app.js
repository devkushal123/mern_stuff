import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import chatsRoutes from './routes/chats.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import adminRoutes from './routes/admin.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

export function buildApp() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/chats', chatsRoutes);
  app.use('/messages', messagesRoutes);
  app.use('/admin', adminRoutes);
  app.use('/analytics', analyticsRoutes);

  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal error' });
  });

  return app;
}
