import { createZodDto } from 'nestjs-zod';
import { resetPasswordSchema } from '@toqe/contracts';

export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
