import prisma from '../../utils/prisma.js';

// ─── Travel Tickets ──────────────────────────────────────────────────────────

export async function createTravelTicket(tripId, data) {
  return prisma.travelTicket.create({
    data: { tripId, ...data }
  });
}

export async function getTravelTickets(tripId) {
  return prisma.travelTicket.findMany({
    where: { tripId },
    orderBy: { departureAt: 'asc' }
  });
}

export async function updateTravelTicket(tripId, ticketId, data) {
  return prisma.travelTicket.update({
    where: { id: ticketId, tripId },
    data
  });
}

export async function deleteTravelTicket(tripId, ticketId) {
  await prisma.travelTicket.delete({
    where: { id: ticketId, tripId }
  });
}

// ─── Hotel Bookings ──────────────────────────────────────────────────────────

export async function createHotelBooking(tripId, data) {
  return prisma.hotelBooking.create({
    data: { tripId, ...data }
  });
}

export async function getHotelBookings(tripId) {
  return prisma.hotelBooking.findMany({
    where: { tripId },
    orderBy: { checkIn: 'asc' }
  });
}

export async function updateHotelBooking(tripId, bookingId, data) {
  return prisma.hotelBooking.update({
    where: { id: bookingId, tripId },
    data
  });
}

export async function deleteHotelBooking(tripId, bookingId) {
  await prisma.hotelBooking.delete({
    where: { id: bookingId, tripId }
  });
}

// ─── Rental Details ──────────────────────────────────────────────────────────

export async function createRentalDetail(tripId, data) {
  return prisma.rentalDetail.create({
    data: { tripId, ...data }
  });
}

export async function getRentalDetails(tripId) {
  return prisma.rentalDetail.findMany({
    where: { tripId },
    orderBy: { pickupAt: 'asc' }
  });
}

export async function updateRentalDetail(tripId, rentalId, data) {
  return prisma.rentalDetail.update({
    where: { id: rentalId, tripId },
    data
  });
}

export async function deleteRentalDetail(tripId, rentalId) {
  await prisma.rentalDetail.delete({
    where: { id: rentalId, tripId }
  });
}
