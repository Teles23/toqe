import { createZodDto } from 'nestjs-zod';
import { updatePreferenciasSchema } from '@toqe/contracts';

export class UpdatePreferenciasDto extends createZodDto(
  updatePreferenciasSchema,
) {}
