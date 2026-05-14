import { createZodDto } from 'nestjs-zod';
import { convidarMembroSchema } from '@toqe/contracts';

export class ConvidarMembroDto extends createZodDto(convidarMembroSchema) {}

export const PerfilMembro = {
  DONO: 'dono',
  GERENTE: 'gerente',
  BARBEIRO: 'barbeiro',
  RECEPCIONISTA: 'recepcionista',
  CLIENTE: 'cliente',
} as const;

export type PerfilMembro = (typeof PerfilMembro)[keyof typeof PerfilMembro];
