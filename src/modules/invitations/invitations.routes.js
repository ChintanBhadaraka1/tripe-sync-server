import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTripMember } from '../../middleware/tripMember.js';
import {
  httpInviteByEmail,
  httpGetMyPendingInvitations,
  httpAcceptInvitation,
  httpDeclineInvitation,
  httpGetTripInvitations
} from './invitations.controller.js';

const router = Router();

router.use(authenticate);

// ─── My Invitations ───────────────────────────────────────────────────────────
router.get('/', httpGetMyPendingInvitations);
router.post('/:inviteId/accept', httpAcceptInvitation);
router.post('/:inviteId/decline', httpDeclineInvitation);

// ─── Trip-scoped Invitations (must use /api/v1/trips/:tripId/invitations) ───
// These will be mounted from the trips router or main router, but let's mount them in main router for simplicity
// E.g., router.post('/trips/:tripId/invitations', ...)

export default router;
