import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  source: z.string().optional().or(z.literal('')),
  status: z.enum(['new', 'contacted', 'qualified', 'won', 'lost']),
});

export default leadSchema;