import prisma from '../utils/prisma.js';
import { createError } from './errorHandler.js';

/**
 * Middleware that ensures req.user is a member of the trip identified by :tripId.
 * Attaches req.tripMember (the TripMember record) for use in downstream handlers.
 * Must be used AFTER the authenticate middleware.
 */
export async function requireTripMember(req, _res, next) {
  try {
    const tripId = req.params.tripId;
    if (!tripId) return next(createError(400, 'tripId param is required.'));

    const member = await prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId, userId: req.user.id } },
    });

    if (!member) {
      return next(createError(403, 'You are not a member of this trip.'));
    }

    req.tripMember = member; // { id, tripId, userId, role, joinedAt }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Further restricts a route to trip owners only.
 * Must be used AFTER requireTripMember.
 */
export function requireTripOwner(req, _res, next) {
  if (req.tripMember?.role !== 'OWNER') {
    return next(createError(403, 'Only the trip owner can perform this action.'));
  }
  next();
}
