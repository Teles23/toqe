import { createZodDto } from 'nestjs-zod';
import { gerarConviteSchema } from '@toqe/contracts';

export class GerarConviteDto extends createZodDto(gerarConviteSchema) {}
