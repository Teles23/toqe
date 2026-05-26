import { createZodDto } from 'nestjs-zod';
import { aceitarConviteSchema } from '@toqe/contracts';

export class AceitarConviteDto extends createZodDto(aceitarConviteSchema) {}
