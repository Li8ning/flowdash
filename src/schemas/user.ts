import { z } from 'zod';

export const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long."),
  name: z.string().min(1, "Name is required."),
  password: z.string().min(8, "Password must be at least 8 characters long.").optional(),
  role: z.enum(['admin', 'floor_staff', 'super_admin']),
});