import { createZodDto } from 'nestjs-zod';
import { loginSchema } from '@toqe/contracts';

/**
 * DTO de login gerado a partir do schema Zod compartilhado em `@toqe/contracts`.
 * `nestjs-zod` extrai o schema e:
 *   - valida o body via `ZodValidationPipe` global;
 *   - gera a documentação Swagger automaticamente.
 */
export class LoginDto extends createZodDto(loginSchema) {}
