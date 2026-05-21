import { createZodDto } from 'nestjs-zod';
import { updateStatusAdminSchema } from '@toqe/contracts';

export class UpdateStatusDto extends createZodDto(updateStatusAdminSchema) {}
