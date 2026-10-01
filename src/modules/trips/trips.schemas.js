import { z } from 'zod';

export const createTripSchema = z.object({
  name: z.string().min(1, 'Trip name is required').max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().datetime({ offset: true }).optional().nullable(),
  expectedEndDate: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updateTripSchema = createTripSchema.partial();

export const joinTripSchema = z.object({
  code: z.string().min(4, 'Share code is required'),
  claimMemberId: z.string().optional().nullable(),
});

export const joinPreviewSchema = z.object({
  code: z.string().min(4, 'Share code is required'),
});

export const addMemberSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
});

export const renameMemberSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
});
