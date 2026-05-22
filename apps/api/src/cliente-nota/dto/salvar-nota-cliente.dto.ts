import { createZodDto } from 'nestjs-zod';
import { salvarNotaClienteSchema } from '@toqe/contracts';

export class SalvarNotaClienteDto extends createZodDto(
  salvarNotaClienteSchema,
) {}
