import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix global de versão
  app.setGlobalPrefix('api/v1');

  // Validação global de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // CORS
  app.enableCors();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Toqe API')
    .setDescription(
      'API REST do sistema Toqe — SaaS multi-tenant para gestão de barbearias.\n\n' +
      '## Como usar\n' +
      '1. Use `POST /api/v1/auth/register` para criar um usuário\n' +
      '2. Use `POST /api/v1/auth/login` para obter o `access_token`\n' +
      '3. Clique em **Authorize** e cole o token no campo `Bearer`\n' +
      '4. Passe o header `x-tenant-id` com o código da barbearia nas rotas de tenant'
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
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API rodando em http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger disponível em http://localhost:${port}/docs`);
}
bootstrap();
