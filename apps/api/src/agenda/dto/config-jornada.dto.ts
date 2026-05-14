import { createZodDto } from 'nestjs-zod';
import { configJornadaSchema } from '@toqe/contracts';

export class ConfigJornadaDto extends createZodDto(configJornadaSchema) {}
