import { createZodDto } from 'nestjs-zod';
import { criarClienteRapidoSchema } from '@toqe/contracts';

export class CriarClienteRapidoDto extends createZodDto(
  criarClienteRapidoSchema,
) {}
