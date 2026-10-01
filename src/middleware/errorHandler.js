/**
 * Global error handler middleware.
 * Catches all errors thrown or passed via next(err).
 */
export function errorHandler(err, _req, res, _next) {
  // Prisma known request errors
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      // Unique constraint violation
      const field = err.meta?.target?.[0] ?? 'field';
      return res.status(409).json({ error: `A record with that ${field} already exists.` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found.' });
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.' });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(422).json({
      error: 'Validation failed.',
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  // Known operational errors (thrown with a statusCode)
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown / unexpected errors
  console.error('[Unhandled Error]', err);
  return res.status(500).json({ error: 'Internal server error.' });
}

/**
 * Creates an operational error with a status code.
 * Usage: throw createError(404, 'User not found')
 */
export function createError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}
