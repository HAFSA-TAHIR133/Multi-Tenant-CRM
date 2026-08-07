import { z } from 'zod';

const leadSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  source: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  value: z.string().optional().or(z.literal('')),
  status: z.enum(['open', 'closed']),
  pipelineId: z.string().optional().or(z.literal('')),
  stageId: z.string().optional().or(z.literal('')),
  assignedUserId: z.union([z.number(), z.string(), z.null()]).optional()
});

export default leadSchema;