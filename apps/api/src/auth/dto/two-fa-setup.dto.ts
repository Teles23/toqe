import { createZodDto } from 'nestjs-zod';
import { twoFaSetupSchema } from '@toqe/contracts';

export class TwoFaSetupDto extends createZodDto(twoFaSetupSchema) {}
