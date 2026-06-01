import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class CriarAgendamentoPublicoDto extends createZodDto(
  z.object({
    clienteNome: z.string().min(1, 'Nome do cliente obrigatório'),
    clienteEmail: z.string().email('E-mail inválido'),
    servicoCodigo: z.number().int().positive('Código de serviço inválido'),
    barbeiroId: z.number().int().positive('Código de barbeiro inválido'),
    inicio: z.string().datetime({ message: 'Data/hora de início inválida' }),
  }),
) {}
