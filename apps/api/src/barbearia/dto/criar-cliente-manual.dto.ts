import { createZodDto } from 'nestjs-zod';
import { criarClienteManualSchema } from '@toqe/contracts';

/**
 * Cadastro manual de cliente pelo barbeiro (tela Clientes do app mobile).
 * E-mail opcional — o serviço gera um sintético quando ausente, igual ao
 * walk-in. Ver `criarClienteManualSchema` em @toqe/contracts.
 */
export class CriarClienteManualDto extends createZodDto(
  criarClienteManualSchema,
) {}
