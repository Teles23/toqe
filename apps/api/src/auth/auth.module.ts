import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuarioModule } from '../usuario/usuario.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { NotificacaoModule } from '../notificacao/notificacao.module';
import {
  GOOGLE_TOKEN_VERIFIER,
  GoogleAuthLibraryVerifier,
} from './google-token-verifier';

@Module({
  imports: [
    UsuarioModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '15m' },
    }),
    NotificacaoModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    // GoogleTokenVerifier via DI: prod usa google-auth-library (validação real),
    // testes de integração substituem via overrideProvider com stub determinístico.
    { provide: GOOGLE_TOKEN_VERIFIER, useClass: GoogleAuthLibraryVerifier },
  ],
})
export class AuthModule {}
