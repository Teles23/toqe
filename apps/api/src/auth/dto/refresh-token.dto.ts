import { createZodDto } from 'nestjs-zod';
import { refreshTokenSchema } from '@toqe/contracts';

/** DTO de refresh-token gerado a partir do schema Zod compartilhado. */
export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
