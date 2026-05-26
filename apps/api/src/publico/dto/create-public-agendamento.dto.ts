import { createZodDto } from 'nestjs-zod';
import { createPublicAgendamentoSchema } from '@toqe/contracts';

/**
 * DTO do POST /publico/:slug/agendamentos — reusa o schema Zod compartilhado.
 *
 * O `barbeiroId` aceita 0 para "qualquer barbeiro disponível"; o service
 * decide automaticamente nesse caso.
 */
export class CreatePublicAgendamentoDto extends createZodDto(
  createPublicAgendamentoSchema,
) {}
