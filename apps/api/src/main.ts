import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe, patchNestJsSwagger } from 'nestjs-zod';
import { GlobalExceptionFilter } from './observabilidade/sentry.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Substitui o logger padrão do NestJS pelo Pino (JSON em prod, pretty em dev)
  app.useLogger(app.get(Logger));

  // Filtro global: loga erros 5xx com contexto tenant/usuário + resposta padronizada
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Prefix global de versão
  app.setGlobalPrefix('api/v1', {
    exclude: ['health/*path'],
  });

  // Validação global de DTOs:
  // - ZodValidationPipe trata DTOs criados via `createZodDto(...)` em @toqe/contracts.
  // - ValidationPipe (class-validator) ainda atende DTOs legados que não foram migrados.
  // Estratégia: migração incremental, módulo a módulo, sem big-bang.
  app.useGlobalPipes(
    new ZodValidationPipe(),
    new ValidationPipe({
      transform: true,
    }),
  );

  // Segurança HTTP: headers de proteção (XSS, Clickjacking, MIME sniffing…)
  app.use(helmet());

  // CORS — credentials obrigatório para cookies httpOnly do frontend
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3002'],
    credentials: true,
  });

  // Patch necessário para que o @nestjs/swagger leia os schemas Zod expostos
  // pelos DTOs gerados via `createZodDto`.
  patchNestJsSwagger();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Toqe API')
    .setDescription(
      'API REST do sistema Toqe — SaaS multi-tenant para gestão de barbearias.\n\n' +
        '## Como usar\n' +
        '1. Use `POST /api/v1/auth/register` para criar um usuário\n' +
        '2. Use `POST /api/v1/auth/login` para obter o `access_token`\n' +
        '3. Clique em **Authorize** e cole o token no campo `Bearer`\n' +
        '4. Passe o header `x-tenant-id` com o código da barbearia nas rotas de tenant',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-tenant-id' },
      'x-tenant-id',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 API rodando em http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger disponível em http://localhost:${port}/docs`);
}
bootstrap();
