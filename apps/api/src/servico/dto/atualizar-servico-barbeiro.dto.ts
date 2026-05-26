import { createZodDto } from 'nestjs-zod';
import { atualizarServicoBarbeiroSchema } from '@toqe/contracts';

export class AtualizarServicoBarbeiroDto extends createZodDto(
  atualizarServicoBarbeiroSchema,
) {}
