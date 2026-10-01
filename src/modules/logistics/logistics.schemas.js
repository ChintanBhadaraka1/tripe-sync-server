import { z } from 'zod';

export const travelTicketSchema = z.object({
  mode: z.enum(['flight', 'train', 'bus']),
  fromPlace: z.string().min(1, 'From place is required'),
  toPlace: z.string().min(1, 'To place is required'),
  departureAt: z.string().datetime({ offset: true }),
  arrivalAt: z.string().datetime({ offset: true }).optional().nullable(),
  pnr: z.string().optional().nullable(),
  seatInfo: z.string().optional().nullable(),
  cost: z.number().int().min(0).optional().nullable(), // In paise
  documentUrl: z.string().url().optional().nullable(),
  transactionId: z.string().optional().nullable(),
});

export const hotelBookingSchema = z.object({
  hotelName: z.string().min(1, 'Hotel name is required'),
  address: z.string().optional().nullable(),
  checkIn: z.string().datetime({ offset: true }),
  checkOut: z.string().datetime({ offset: true }),
  bookingRef: z.string().optional().nullable(),
  cost: z.number().int().min(0).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
  transactionId: z.string().optional().nullable(),
});

export const rentalDetailSchema = z.object({
  type: z.enum(['car', 'bike']),
  vendor: z.string().min(1, 'Vendor name is required'),
  pickupAt: z.string().datetime({ offset: true }),
  dropAt: z.string().datetime({ offset: true }),
  deposit: z.number().int().min(0).optional().nullable(),
  cost: z.number().int().min(0).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
  transactionId: z.string().optional().nullable(),
});

// Partials for updates
export const updateTravelTicketSchema = travelTicketSchema.partial();
export const updateHotelBookingSchema = hotelBookingSchema.partial();
export const updateRentalDetailSchema = rentalDetailSchema.partial();
