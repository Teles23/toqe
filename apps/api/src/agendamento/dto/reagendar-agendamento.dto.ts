import { createZodDto } from 'nestjs-zod';
import { reagendarAgendamentoSchema } from '@toqe/contracts';

export class ReagendarAgendamentoDto extends createZodDto(
  reagendarAgendamentoSchema,
) {}
