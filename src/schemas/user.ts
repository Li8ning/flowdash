import { z } from 'zod';

// Reserved words that cannot be used as usernames
const RESERVED_WORDS = [
  'admin', 'root', 'system', 'superuser', 'administrator',
  'support', 'help', 'info', 'contact', 'webmaster',
  'api', 'test', 'demo', 'guest', 'user', 'null', 'undefined'
];

export const userSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters long.")
    .max(20, "Username cannot exceed 20 characters.")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens.")
    .refine((username) => !/^[._-]/.test(username), "Username cannot start with special characters.")
    .refine((username) => !/[._-]$/.test(username), "Username cannot end with special characters.")
    .refine((username) => !/[._-]{2,}/.test(username), "Username cannot have consecutive special characters.")
    .refine((username) => !RESERVED_WORDS.includes(username.toLowerCase()), "This username is not allowed."),
  name: z.string().min(1, "Name is required."),
  password: z.string().min(8, "Password must be at least 8 characters long.").optional(),
  role: z.enum(['admin', 'floor_staff', 'super_admin']),
});