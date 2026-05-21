import { createZodDto } from 'nestjs-zod';
import { createAvaliacaoSchema } from '@toqe/contracts';

export class CreateAvaliacaoDto extends createZodDto(createAvaliacaoSchema) {}
