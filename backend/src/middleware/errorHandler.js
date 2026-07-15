
function errorHandler(err, req, res, next) {
  console.error('[Error]', err);

 
  if (err.code === '23505') {
    return res.status(409).json({ error: 'A record with that value already exists' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced record does not exist' });
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
