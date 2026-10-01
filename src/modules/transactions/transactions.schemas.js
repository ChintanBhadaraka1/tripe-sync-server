import { z } from 'zod';

const payerSchema = z.object({
  memberId: z.string(),
  paidAmount: z.number().int().min(0, 'Amount cannot be negative'), // In paise
});

const splitSchema = z.object({
  memberId: z.string(),
  owedAmount: z.number().int().min(0).optional(), // Used for exact or calculated amounts
  share: z.number().optional(), // Used for percentage or shares
});

export const createTransactionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.number().int().positive('Amount must be greater than zero'), // In paise
  category: z.string().default('other'),
  date: z.string().datetime({ offset: true }).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  splitType: z.enum(['EQUAL', 'EXACT', 'PERCENTAGE', 'SHARES']).default('EQUAL'),
  payers: z.array(payerSchema).min(1, 'At least one payer is required'),
  splits: z.array(splitSchema).min(1, 'At least one split is required'),
  linkedLogistic: z.object({
    id: z.string(),
    type: z.enum(['TICKET', 'HOTEL', 'RENTAL'])
  }).optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const personalExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z.number().int().positive('Amount must be greater than zero'),
  category: z.string().default('other'),
  date: z.string().datetime({ offset: true }).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const updatePersonalExpenseSchema = personalExpenseSchema.partial();
