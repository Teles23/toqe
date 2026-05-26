import { createZodDto } from 'nestjs-zod';
import { patchStatusAgendamentoSchema } from '@toqe/contracts';
import { StatusAgendamento } from '../../common/constants/agendamento-status';

export { StatusAgendamento };

export class PatchStatusAgendamentoDto extends createZodDto(
  patchStatusAgendamentoSchema,
) {}
