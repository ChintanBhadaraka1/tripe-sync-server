import * as service from './logistics.service.js';
import * as schemas from './logistics.schemas.js';

// ─── Travel Tickets ──────────────────────────────────────────────────────────

export async function httpCreateTravelTicket(req, res, next) {
  try {
    const data = schemas.travelTicketSchema.parse(req.body);
    const ticket = await service.createTravelTicket(req.params.tripId, data);
    res.status(201).json({ ticket });
  } catch (err) { next(err); }
}

export async function httpGetTravelTickets(req, res, next) {
  try {
    const tickets = await service.getTravelTickets(req.params.tripId);
    res.json({ tickets });
  } catch (err) { next(err); }
}

export async function httpUpdateTravelTicket(req, res, next) {
  try {
    const data = schemas.updateTravelTicketSchema.parse(req.body);
    const ticket = await service.updateTravelTicket(req.params.tripId, req.params.ticketId, data);
    res.json({ ticket });
  } catch (err) { next(err); }
}

export async function httpDeleteTravelTicket(req, res, next) {
  try {
    await service.deleteTravelTicket(req.params.tripId, req.params.ticketId);
    res.json({ message: 'Ticket deleted.' });
  } catch (err) { next(err); }
}

// ─── Hotel Bookings ──────────────────────────────────────────────────────────

export async function httpCreateHotelBooking(req, res, next) {
  try {
    const data = schemas.hotelBookingSchema.parse(req.body);
    const booking = await service.createHotelBooking(req.params.tripId, data);
    res.status(201).json({ booking });
  } catch (err) { next(err); }
}

export async function httpGetHotelBookings(req, res, next) {
  try {
    const bookings = await service.getHotelBookings(req.params.tripId);
    res.json({ bookings });
  } catch (err) { next(err); }
}

export async function httpUpdateHotelBooking(req, res, next) {
  try {
    const data = schemas.updateHotelBookingSchema.parse(req.body);
    const booking = await service.updateHotelBooking(req.params.tripId, req.params.bookingId, data);
    res.json({ booking });
  } catch (err) { next(err); }
}

export async function httpDeleteHotelBooking(req, res, next) {
  try {
    await service.deleteHotelBooking(req.params.tripId, req.params.bookingId);
    res.json({ message: 'Hotel booking deleted.' });
  } catch (err) { next(err); }
}

// ─── Rental Details ──────────────────────────────────────────────────────────

export async function httpCreateRentalDetail(req, res, next) {
  try {
    const data = schemas.rentalDetailSchema.parse(req.body);
    const rental = await service.createRentalDetail(req.params.tripId, data);
    res.status(201).json({ rental });
  } catch (err) { next(err); }
}

export async function httpGetRentalDetails(req, res, next) {
  try {
    const rentals = await service.getRentalDetails(req.params.tripId);
    res.json({ rentals });
  } catch (err) { next(err); }
}

export async function httpUpdateRentalDetail(req, res, next) {
  try {
    const data = schemas.updateRentalDetailSchema.parse(req.body);
    const rental = await service.updateRentalDetail(req.params.tripId, req.params.rentalId, data);
    res.json({ rental });
  } catch (err) { next(err); }
}

export async function httpDeleteRentalDetail(req, res, next) {
  try {
    await service.deleteRentalDetail(req.params.tripId, req.params.rentalId);
    res.json({ message: 'Rental detail deleted.' });
  } catch (err) { next(err); }
}
