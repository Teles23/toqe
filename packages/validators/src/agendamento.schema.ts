import { z } from 'zod';

export const createAgendamentoSchema = z.object({
  barbeiroId: z.number(),
  servicosIds: z.array(z.number()),
  inicio: z.string().datetime()
});
