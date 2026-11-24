export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Endpoint not found.' });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  console.error(error);
  res.status(error.statusCode ?? 500).json({
    error: error.statusCode ? error.message : 'An unexpected server error occurred.'
  });
}
