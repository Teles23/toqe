import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CriarApiKeyDto extends createZodDto(
  z.object({
    nome: z.string().min(1, 'Nome obrigatório').max(100, 'Nome muito longo'),
  }),
) {}
