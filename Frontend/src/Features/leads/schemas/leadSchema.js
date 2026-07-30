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
  status: z.enum(['new', 'open', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'completed']),
  pipelineId: z.string().min(1, 'Pipeline is required'),
  stageId: z.string().min(1, 'Stage is required'),
});

export default leadSchema;