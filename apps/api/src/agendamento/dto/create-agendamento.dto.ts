import { createZodDto } from 'nestjs-zod';
import { createAgendamentoSchema } from '@toqe/contracts';

export class CreateAgendamentoDto extends createZodDto(
  createAgendamentoSchema,
) {}
