import { createZodDto } from 'nestjs-zod';
import { updatePlanoSchema } from '@toqe/contracts';

export class UpdatePlanoDto extends createZodDto(updatePlanoSchema) {}
