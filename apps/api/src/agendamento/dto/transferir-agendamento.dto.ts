import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class TransferirAgendamentoDto extends createZodDto(
  z.object({
    novoBarbeiroId: z
      .number({
        invalid_type_error: 'novoBarbeiroId deve ser um número inteiro',
      })
      .int()
      .positive('novoBarbeiroId deve ser positivo'),
  }),
) {}
