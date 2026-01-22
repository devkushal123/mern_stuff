
export function notFound(req, res, next) {
  res.status(404).json({ error: 'Not Found' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) {
    req.log?.error({ err }, message);
  } else {
    req.log?.warn({ err }, message);
  }
  res.status(status).json({ error: message });
}
