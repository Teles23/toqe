import { createZodDto } from 'nestjs-zod';
import { updateUsuarioSchema } from '@toqe/contracts';

export class UpdateUsuarioDto extends createZodDto(updateUsuarioSchema) {}
