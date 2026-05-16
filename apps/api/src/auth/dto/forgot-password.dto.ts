import { createZodDto } from 'nestjs-zod';
import { forgotPasswordSchema } from '@toqe/contracts';

export class ForgotPasswordDto extends createZodDto(forgotPasswordSchema) {}
