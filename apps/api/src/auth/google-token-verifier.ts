import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

/**
 * Payload mínimo extraído de um ID token Google verificado.
 */
export interface VerifiedGooglePayload {
  email: string;
  nome: string;
  avatarUrl: string | null;
}

/**
 * Interface para verificação de ID tokens Google.
 * Usada com Dependency Inversion: produção injeta GoogleAuthLibraryVerifier,
 * testes de integração injetam um stub determinístico via overrideProvider.
 */
export interface GoogleTokenVerifier {
  verify(idToken: string): Promise<VerifiedGooglePayload>;
}

/**
 * Símbolo de injeção — evita colisão de strings entre módulos.
 */
export const GOOGLE_TOKEN_VERIFIER = Symbol('GoogleTokenVerifier');

/**
 * Implementação real usando google-auth-library.
 * Valida o ID token contra o GOOGLE_CLIENT_ID (audience).
 */
@Injectable()
export class GoogleAuthLibraryVerifier implements GoogleTokenVerifier {
  private client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      // Falha rápida na inicialização se a env var não foi configurada
      throw new Error(
        'GOOGLE_CLIENT_ID não configurado — defina no .env do backend',
      );
    }
    this.client = new OAuth2Client(clientId);
  }

  async verify(idToken: string): Promise<VerifiedGooglePayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new UnauthorizedException('ID token Google inválido');
      }
      return {
        email: payload.email,
        nome: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('ID token Google inválido ou expirado');
    }
  }
}
