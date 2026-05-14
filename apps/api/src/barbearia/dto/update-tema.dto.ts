import { createZodDto } from 'nestjs-zod';
import { updateTemaSchema } from '@toqe/contracts';

export class UpdateTemaDto extends createZodDto(updateTemaSchema) {}
