import { Router } from 'express';
import * as controller from './logistics.controller.js';

const router = Router({ mergeParams: true });

// ─── Travel Tickets ──────────────────────────────────────────────────────────
router.post('/tickets', controller.httpCreateTravelTicket);
router.get('/tickets', controller.httpGetTravelTickets);
router.patch('/tickets/:ticketId', controller.httpUpdateTravelTicket);
router.delete('/tickets/:ticketId', controller.httpDeleteTravelTicket);

// ─── Hotel Bookings ──────────────────────────────────────────────────────────
router.post('/hotels', controller.httpCreateHotelBooking);
router.get('/hotels', controller.httpGetHotelBookings);
router.patch('/hotels/:bookingId', controller.httpUpdateHotelBooking);
router.delete('/hotels/:bookingId', controller.httpDeleteHotelBooking);

// ─── Rental Details ──────────────────────────────────────────────────────────
router.post('/rentals', controller.httpCreateRentalDetail);
router.get('/rentals', controller.httpGetRentalDetails);
router.patch('/rentals/:rentalId', controller.httpUpdateRentalDetail);
router.delete('/rentals/:rentalId', controller.httpDeleteRentalDetail);

export default router;
