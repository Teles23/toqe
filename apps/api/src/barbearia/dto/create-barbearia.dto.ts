import { createZodDto } from 'nestjs-zod';
import { createBarbeariaSchema } from '@toqe/contracts';

export class CreateBarbeariaDto extends createZodDto(createBarbeariaSchema) {}
