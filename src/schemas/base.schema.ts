import { z } from 'zod';

/**
 * BaseInputPropsSchema — props herdadas por todos os inputs.
 * Espelha campos @property de InputBaseComponent da populis-v3-core
 * + envoltorio BaseControl (class, hide).
 */
export const BaseInputPropsSchema = z.object({
  name: z.string().min(1, 'name e obrigatorio'),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  readonly: z.boolean().optional(),
  hint: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  showCaracterCounter: z.boolean().optional(),
  highlight: z.boolean().optional(),
  doNotTranslate: z.boolean().optional(),
  customRequiredWarning: z.string().optional(),
  value: z.unknown().optional(),
  labelClass: z.string().optional(),
  requestFocus: z.boolean().optional(),
  keyboardOptions: z.record(z.unknown()).optional(),
});

export type BaseInputProps = z.infer<typeof BaseInputPropsSchema>;