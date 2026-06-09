import { z } from 'zod';
import { FieldSchema } from './inputs.schema';

export const FormSchema = z.object({
  schemaVersion: z.literal(1),
  formId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  fields: z.array(FieldSchema),
});

export type FormPayload = z.infer<typeof FormSchema>;