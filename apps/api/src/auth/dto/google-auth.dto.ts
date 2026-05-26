import { createZodDto } from 'nestjs-zod';
import { googleAuthSchema } from '@toqe/contracts';

export class GoogleAuthDto extends createZodDto(googleAuthSchema) {}
