import { createZodDto } from 'nestjs-zod';
import { createBloqueioSchema } from '@toqe/contracts';

export class CreateBloqueioDto extends createZodDto(createBloqueioSchema) {}
