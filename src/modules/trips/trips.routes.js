import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireTripMember, requireTripOwner } from '../../middleware/tripMember.js';
import {
  httpCreateTrip,
  httpGetMyTrips,
  httpGetTrip,
  httpUpdateTrip,
  httpDeleteTrip,
  httpGetTripMembers,
  httpAddPlaceholderMember,
  httpRenameTripMember,
  httpRemoveTripMember,
  httpUnlinkTripMember,
  httpRegenerateShareCode,
  httpPreviewJoinTrip,
  httpJoinTripByCode,
} from './trips.controller.js';
import {
  httpInviteByEmail,
  httpGetTripInvitations
} from '../invitations/invitations.controller.js';
import transactionsRoutes from '../transactions/transactions.routes.js';
import balancesRoutes from '../balances/balances.routes.js';
import logisticsRoutes from '../logistics/logistics.routes.js';
import documentsRoutes from '../documents/documents.routes.js';

const router = Router();

// All trip routes require authentication
router.use(authenticate);

// ─── Trip CRUD ────────────────────────────────────────────────────────────────
router.post('/', httpCreateTrip);                    // Create trip
router.get('/', httpGetMyTrips);                     // My trips
router.post('/join/preview', httpPreviewJoinTrip);   // Preview join (get placeholders)
router.post('/join', httpJoinTripByCode);            // Join via share code

// ─── Single trip — membership required ───────────────────────────────────────
router.get('/:tripId', requireTripMember, httpGetTrip);
router.patch('/:tripId', requireTripMember, requireTripOwner, httpUpdateTrip);
router.delete('/:tripId', requireTripMember, requireTripOwner, httpDeleteTrip);

// ─── Members & Invitations ───────────────────────────────────────────────────
router.get('/:tripId/members', requireTripMember, httpGetTripMembers);
router.post('/:tripId/members', requireTripMember, requireTripOwner, httpAddPlaceholderMember);
router.patch('/:tripId/members/:memberId', requireTripMember, requireTripOwner, httpRenameTripMember);
router.delete('/:tripId/members/:memberId', requireTripMember, requireTripOwner, httpRemoveTripMember);
router.post('/:tripId/members/:memberId/unlink', requireTripMember, requireTripOwner, httpUnlinkTripMember);

router.post('/:tripId/invitations', requireTripMember, httpInviteByEmail);
router.get('/:tripId/invitations', requireTripMember, httpGetTripInvitations);

// ─── Transactions & Personal Expenses ────────────────────────────────────────
router.use('/:tripId/transactions', requireTripMember, transactionsRoutes);

// ─── Balances & Settlements ──────────────────────────────────────────────────
router.use('/:tripId/balances', requireTripMember, balancesRoutes);

// ─── Logistics (Tickets, Hotels, Rentals) ────────────────────────────────────
router.use('/:tripId/logistics', requireTripMember, logisticsRoutes);

// ─── Documents ───────────────────────────────────────────────────────────────
router.use('/:tripId/documents', requireTripMember, documentsRoutes);

// ─── Share code regeneration (owner only) ────────────────────────────────────
router.post('/:tripId/regenerate-code', requireTripMember, requireTripOwner, httpRegenerateShareCode);

export default router;
