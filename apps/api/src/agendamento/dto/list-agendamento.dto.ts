import { createZodDto } from 'nestjs-zod';
import { listAgendamentoSchema } from '@toqe/contracts';

export class ListAgendamentoDto extends createZodDto(listAgendamentoSchema) {}
