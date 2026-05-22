import { createZodDto } from 'nestjs-zod';
import { configJornadaSemanalSchema } from '@toqe/contracts';

export class ConfigJornadaSemanalDto extends createZodDto(
  configJornadaSemanalSchema,
) {}
