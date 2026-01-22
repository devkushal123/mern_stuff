
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

export function security({ corsOrigin, rateLimitWindowMs = 60000, rateLimitMax = 100 }) {
  const corsMiddleware = cors({
    origin: corsOrigin ? corsOrigin.split(',') : false, // set specific origins in prod
    credentials: true
  });

  const limiter = rateLimit({
    windowMs: Number(rateLimitWindowMs),
    max: Number(rateLimitMax),
    standardHeaders: true,
    legacyHeaders: false
  });

  return {
    helmet: helmet(),
    cors: corsMiddleware,
    limiter
  };
}
