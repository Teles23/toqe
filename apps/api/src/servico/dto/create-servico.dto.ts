import { createZodDto } from 'nestjs-zod';
import { createServicoSchema } from '@toqe/contracts';

export class CreateServicoDto extends createZodDto(createServicoSchema) {}
