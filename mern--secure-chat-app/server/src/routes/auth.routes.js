import { Router } from 'express';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password, roles } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already in use' });

  const user = new User({ name, email, roles: roles?.length ? roles : ['user'] });
  await user.setPassword(password);
  const refreshToken = signRefreshToken(user);
  await user.setRefreshToken(refreshToken);
  await user.save();

  const accessToken = signAccessToken(user);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, sameSite: 'strict', secure: false,
    maxAge: 7*24*60*60*1000
  });

  res.json({
    user: { id: user._id, name: user.name, email: user.email, roles: user.roles },
    accessToken
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.verifyPassword(password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const refreshToken = signRefreshToken(user);
  await user.setRefreshToken(refreshToken);
  await user.save();

  const accessToken = signAccessToken(user);
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, sameSite: 'strict', secure: false,
    maxAge: 7*24*60*60*1000
  });

  res.json({
    user: { id: user._id, name: user.name, email: user.email, roles: user.roles },
    accessToken
  });
});

router.post('/refresh', async (req, res) => {
  try {
    const rt = req.cookies?.refreshToken;
    if (!rt) return res.status(401).json({ message: 'No refresh token' });
    const payload = verifyRefreshToken(rt);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const valid = await user.verifyRefreshToken(rt);
    if (!valid) return res.status(401).json({ message: 'Invalid refresh token' });

    const newRT = signRefreshToken(user);
    await user.setRefreshToken(newRT);
    await user.save();

    res.cookie('refreshToken', newRT, {
      httpOnly: true, sameSite: 'strict', secure: false,
      maxAge: 7*24*60*60*1000
    });

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ message: 'Refresh failed' });
  }
});

router.post('/logout', async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ ok: true });
});

export default router;
