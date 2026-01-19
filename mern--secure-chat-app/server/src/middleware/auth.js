import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing token' });

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = { id: user._id.toString(), roles: user.roles };
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}
