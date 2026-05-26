import { createZodDto } from 'nestjs-zod';
import { updateServicoSchema } from '@toqe/contracts';

export class UpdateServicoDto extends createZodDto(updateServicoSchema) {}
