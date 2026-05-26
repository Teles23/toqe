import { createZodDto } from 'nestjs-zod';
import { registerSchema } from '@toqe/contracts';

export class CreateUserDto extends createZodDto(registerSchema) {}
