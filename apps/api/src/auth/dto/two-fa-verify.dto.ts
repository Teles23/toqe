import { createZodDto } from 'nestjs-zod';
import { twoFaVerifySchema } from '@toqe/contracts';

export class TwoFaVerifyDto extends createZodDto(twoFaVerifySchema) {}
