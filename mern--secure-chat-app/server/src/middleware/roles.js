export function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user?.roles) return res.status(403).json({ message: 'Forbidden' });
    const ok = req.user.roles.some(r => allowed.includes(r));
    if (!ok) return res.status(403).json({ message: 'Insufficient role' });
    next();
  };
}
