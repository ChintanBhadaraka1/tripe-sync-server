import jwt from 'jsonwebtoken';
import { createError } from './errorHandler.js';

/**
 * Authenticate middleware — verifies the access token from Authorization header.
 * Attaches req.user = { id, email } on success.
 */
export function authenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next(createError(401, 'Missing or malformed Authorization header.'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err); // Passes JsonWebTokenError / TokenExpiredError to errorHandler
  }
}
