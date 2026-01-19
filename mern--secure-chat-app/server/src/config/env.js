import 'dotenv/config';

export const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpires: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
