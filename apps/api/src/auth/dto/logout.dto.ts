import { createZodDto } from 'nestjs-zod';
import { logoutSchema } from '@toqe/contracts';

/** DTO de logout gerado a partir do schema Zod compartilhado. */
export class LogoutDto extends createZodDto(logoutSchema) {}
