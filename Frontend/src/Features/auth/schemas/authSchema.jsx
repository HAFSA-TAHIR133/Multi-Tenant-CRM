import { z } from 'zod';

// Match rules:
// 1. Standard username before @
// 2. No numbers immediately following @
// 3. Domain ends in gmail.com, .edu, .edu.pk, or .org.pk
const strictEmailRegex =
  /^[a-zA-Z0-9._%+-]+@(?!\d)(?:[a-zA-Z0-9-]+\.)*(gmail\.com|edu|edu\.pk|org\.pk)$/i;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(
      strictEmailRegex,
      'Only valid Gmail, .edu, or .org.pk emails are allowed (no numbers right after @)'
    ),

  password: z
    .string()
    .min(1, 'Password is required')
    .min(3, 'Password must be at least 6 characters'),
});