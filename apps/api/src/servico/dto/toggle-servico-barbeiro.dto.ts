import { createZodDto } from 'nestjs-zod';
import { toggleServicoBarbeiroSchema } from '@toqe/contracts';

export class ToggleServicoBarbeiroDto extends createZodDto(
  toggleServicoBarbeiroSchema,
) {}
