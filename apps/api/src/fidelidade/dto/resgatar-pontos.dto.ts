import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ResgatarPontosDto extends createZodDto(
  z.object({
    clienteCodigo: z.number().int().positive('clienteCodigo inválido'),
    pontos: z.number().int().min(10, 'Mínimo de 10 pontos por resgate'),
  }),
) {}
