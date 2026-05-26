import { createZodDto } from 'nestjs-zod';
import { changePasswordSchema } from '@toqe/contracts';

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
