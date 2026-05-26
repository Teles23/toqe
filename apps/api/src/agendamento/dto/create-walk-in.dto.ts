import { createZodDto } from 'nestjs-zod';
import { createWalkInSchema } from '@toqe/contracts';

export class CreateWalkInDto extends createZodDto(createWalkInSchema) {}
