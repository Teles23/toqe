import { createZodDto } from 'nestjs-zod';
import { upsertHorariosSchema } from '@toqe/contracts';

export class UpsertHorariosDto extends createZodDto(upsertHorariosSchema) {}
