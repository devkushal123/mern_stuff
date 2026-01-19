import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), roles: user.roles },
    env.accessSecret,
    { expiresIn: env.accessExpires }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    env.refreshSecret,
    { expiresIn: env.refreshExpires }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret);
}
