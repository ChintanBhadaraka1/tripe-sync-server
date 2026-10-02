import { Router } from 'express';
import { requireTripMember } from '../../middleware/tripMember.js';
import {
  httpGetItinerary,
  httpAddDay,
  httpAddItem,
  httpUpdateItem,
  httpDeleteItem,
  httpDeleteDay,
} from './itinerary.controller.js';

// Base route: /api/v1/trips/:tripId/itinerary
const router = Router({ mergeParams: true });

// Require user to be a trip member for all itinerary routes
router.use(requireTripMember);

router.get('/', httpGetItinerary);
router.post('/days', httpAddDay);
router.delete('/days/:dayId', httpDeleteDay);
router.post('/items', httpAddItem);

router.patch('/items/:itemId', httpUpdateItem);
router.delete('/items/:itemId', httpDeleteItem);

export default router;
