import { z } from 'zod';

export const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
