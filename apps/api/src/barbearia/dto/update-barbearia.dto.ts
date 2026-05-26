import { createZodDto } from 'nestjs-zod';
import { updateBarbeariaSchema } from '@toqe/contracts';

export class UpdateBarbeariaDto extends createZodDto(updateBarbeariaSchema) {}
