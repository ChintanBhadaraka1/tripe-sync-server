import { z } from 'zod';

export const settlementSchema = z.object({
  payerId: z.string().min(1, 'Payer is required'),
  receiverId: z.string().min(1, 'Receiver is required'),
  amount: z.number().int().positive('Amount must be positive'), // in paise
  date: z.string().datetime({ offset: true }).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});
