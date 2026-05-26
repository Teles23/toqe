import { z } from "zod";

export const updatePreferenciasSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  whatsapp: z.boolean(),
  sms: z.boolean(),
});

export type UpdatePreferenciasInput = z.infer<typeof updatePreferenciasSchema>;
