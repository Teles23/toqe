import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshToken } from '../generated/prisma';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../usuario/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { NotificacaoService } from '../notificacao/notificacao.service';
import {
  GOOGLE_TOKEN_VERIFIER,
  type GoogleTokenVerifier,
} from './google-token-verifier';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { generateSecret, generateURI, verify as otpVerify } from 'otplib';
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private notificacaoService: NotificacaoService,
    @Inject(GOOGLE_TOKEN_VERIFIER)
    private googleVerifier: GoogleTokenVerifier,
  ) {}

  async register(dto: CreateUserDto) {
    return this.usuarioService.create(dto);
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.usuarioService.findByEmail(email);
    return !!user;
  }

  /**
   * Autentica via Google ID token.
   * - Verifica o token via GoogleTokenVerifier (DI)
   * - Se email novo → cria usuário com `senhaHash: null` (OAuth-only)
   * - Se email existe → reusa o user (login transparente)
   * - Emite os mesmos tokens de uma autenticação por senha
   *
   * Usuários criados via Google ficam com `twoFaEnabled: false` por padrão —
   * Google já é um segundo fator externo, sem necessidade do 2FA interno.
   */
  async googleAuth(dto: GoogleAuthDto) {
    const payload = await this.googleVerifier.verify(dto.idToken);

    let user = await this.prisma.usuario.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await this.prisma.usuario.create({
        data: {
          nome: payload.nome,
          email: payload.email,
          avatarUrl: payload.avatarUrl,
          senhaHash: null,
          ativo: true,
        },
      });
    }

    return this.generateTokens(user.codigo, user.nome, user.email);
  }

  async login(dto: LoginDto) {
    const user = await this.usuarioService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Usuário OAuth (Google) não tem senha local — não pode logar via email/senha
    if (!user.senhaHash) {
      throw new UnauthorizedException(
        'Esta conta usa login Google. Use "Entrar com Google".',
      );
    }

    const passwordMatch = await bcrypt.compare(dto.senha, user.senhaHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Se 2FA ativo, retorna token temporário em vez de tokens completos
    if ((user as { twoFaEnabled?: boolean }).twoFaEnabled) {
      const tempToken = this.jwtService.sign(
        { sub: user.codigo, type: '2fa' },
        { expiresIn: '5m' },
      );
      return { requiresTwoFa: true as const, tempToken };
    }

    return this.generateTokens(user.codigo, user.nome, user.email);
  }

  async refresh(dto: RefreshTokenDto) {
    // 1. Busca tokens válidos no banco
    // Nota: Em produção, o ideal é usar Redis para tokens por performance
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revogado: false, expiraEm: { gt: new Date() } },
    });

    let foundToken: RefreshToken | null = null;
    for (const t of tokens) {
      const match = await bcrypt.compare(dto.refreshToken, t.hash);
      if (match) {
        foundToken = t;
        break;
      }
    }

    if (!foundToken) {
      throw new UnauthorizedException(
        'Token de atualização inválido ou expirado',
      );
    }

    // 2. Revoga o token atual (rotação)
    await this.prisma.refreshToken.update({
      where: { codigo: foundToken.codigo },
      data: { revogado: true },
    });

    // 3. Gera novos tokens
    const user = await this.usuarioService.findById(foundToken.usrCodigo);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return this.generateTokens(user.codigo, user.nome, user.email);
  }

  async logout(usrCodigo: number, dto: LogoutDto) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { usrCodigo, revogado: false, expiraEm: { gt: new Date() } },
    });

    for (const t of tokens) {
      const match = await bcrypt.compare(dto.refreshToken, t.hash);
      if (match) {
        await this.prisma.refreshToken.update({
          where: { codigo: t.codigo },
          data: { revogado: true },
        });
        return { message: 'Logout realizado com sucesso' };
      }
    }

    throw new UnauthorizedException('Refresh token inválido ou já revogado');
  }

  async forgotPassword(email: string): Promise<void> {
    // Não revelar se e-mail existe (anti-enumeration)
    const user = await this.usuarioService.findByEmail(email);
    if (!user) return;

    // Invalidar tokens anteriores não usados
    await this.prisma.passwordResetToken.updateMany({
      where: { usrCodigo: user.codigo, usadoEm: null },
      data: { usadoEm: new Date() },
    });

    const rawToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.passwordResetToken.create({
      data: {
        usrCodigo: user.codigo,
        token: hash,
        expiraEm: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      },
    });

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4001';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    await this.notificacaoService.enviarRecuperacaoSenha(
      user.email,
      user.nome,
      resetLink,
    );
  }

  async resetPassword(rawToken: string, novaSenha: string): Promise<void> {
    const hash = createHash('sha256').update(rawToken).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: hash },
      include: { usuario: true },
    });

    if (
      !resetToken ||
      resetToken.usadoEm !== null ||
      resetToken.expiraEm < new Date()
    ) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const senhaHash = await bcrypt.hash(novaSenha, await bcrypt.genSalt());

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { codigo: resetToken.codigo },
        data: { usadoEm: new Date() },
      }),
      this.prisma.usuario.update({
        where: { codigo: resetToken.usrCodigo },
        data: { senhaHash },
      }),
      // Revogar todos os refresh tokens do usuário (segurança)
      this.prisma.refreshToken.updateMany({
        where: { usrCodigo: resetToken.usrCodigo, revogado: false },
        data: { revogado: true },
      }),
    ]);
  }

  async changePassword(
    usrCodigo: number,
    senhaAtual: string,
    novaSenha: string,
    refreshTokenAtual?: string,
  ): Promise<void> {
    const user = await this.usuarioService.findById(usrCodigo);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    if (!user.senhaHash) {
      throw new UnauthorizedException(
        'Conta OAuth não tem senha local para alterar',
      );
    }
    const match = await bcrypt.compare(senhaAtual, user.senhaHash);
    // Senha atual incorreta é um erro de validação do input (400), não de
    // autenticação (401). Um 401 dispararia o interceptor de refresh do mobile,
    // que ao falhar deslogaria o usuário — exatamente o que NÃO queremos aqui.
    if (!match) throw new BadRequestException('Senha atual incorreta');
    const senhaHash = await bcrypt.hash(novaSenha, await bcrypt.genSalt());

    // Identifica a sessão atual (pelo refresh token enviado) para preservá-la:
    // trocar a senha revoga apenas as OUTRAS sessões (outros dispositivos).
    let manterCodigo: number | null = null;
    if (refreshTokenAtual) {
      const ativos = await this.prisma.refreshToken.findMany({
        where: { usrCodigo, revogado: false, expiraEm: { gt: new Date() } },
      });
      for (const t of ativos) {
        if (await bcrypt.compare(refreshTokenAtual, t.hash)) {
          manterCodigo = t.codigo;
          break;
        }
      }
    }

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { codigo: usrCodigo },
        data: { senhaHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: {
          usrCodigo,
          revogado: false,
          ...(manterCodigo !== null ? { codigo: { not: manterCodigo } } : {}),
        },
        data: { revogado: true },
      }),
    ]);
  }

  async listSessions(usrCodigo: number) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { usrCodigo, revogado: false, expiraEm: { gt: new Date() } },
      select: { codigo: true, criadoEm: true, expiraEm: true },
      orderBy: { criadoEm: 'desc' },
    });
    return tokens.map((t) => ({
      codigo: t.codigo,
      criadoEm: t.criadoEm,
      expiraEm: t.expiraEm,
    }));
  }

  async revokeSession(usrCodigo: number, tokenCodigo: number): Promise<void> {
    const token = await this.prisma.refreshToken.findFirst({
      where: { codigo: tokenCodigo, usrCodigo, revogado: false },
    });
    if (!token) throw new UnauthorizedException('Sessão não encontrada');
    await this.prisma.refreshToken.update({
      where: { codigo: tokenCodigo },
      data: { revogado: true },
    });
  }

  async revokeAllSessions(usrCodigo: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { usrCodigo, revogado: false },
      data: { revogado: true },
    });
  }

  async setup2Fa(
    usrCodigo: number,
  ): Promise<{ qrCode: string; secret: string }> {
    const user = await this.usuarioService.findById(usrCodigo);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    const secret = generateSecret();
    const otpauth = generateURI({
      secret,
      label: user.email,
      issuer: 'Toqe',
      strategy: 'totp',
    });
    const qrCodeDataUrl = await qrcode.toDataURL(otpauth);
    await this.prisma.usuario.update({
      where: { codigo: usrCodigo },
      data: { twoFaSecret: secret },
    });
    return { qrCode: qrCodeDataUrl, secret };
  }

  async enable2Fa(usrCodigo: number, code: string): Promise<void> {
    const user = await this.usuarioService.findById(usrCodigo);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    const secret = (user as { twoFaSecret?: string | null }).twoFaSecret;
    if (!secret) throw new UnauthorizedException('Configure o 2FA primeiro');
    const { valid } = await otpVerify({
      strategy: 'totp',
      secret,
      token: code,
    });
    if (!valid) throw new UnauthorizedException('Código inválido');
    await this.prisma.usuario.update({
      where: { codigo: usrCodigo },
      data: { twoFaEnabled: true },
    });
  }

  async disable2Fa(usrCodigo: number, code: string): Promise<void> {
    const user = await this.usuarioService.findById(usrCodigo);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    const secret = (user as { twoFaSecret?: string | null }).twoFaSecret;
    const enabled = (user as { twoFaEnabled?: boolean }).twoFaEnabled;
    if (!enabled || !secret)
      throw new UnauthorizedException('2FA não está ativo');
    const { valid } = await otpVerify({
      strategy: 'totp',
      secret,
      token: code,
    });
    if (!valid) throw new UnauthorizedException('Código inválido');
    await this.prisma.usuario.update({
      where: { codigo: usrCodigo },
      data: { twoFaEnabled: false, twoFaSecret: null },
    });
  }

  async verifyTwoFa(tempToken: string, code: string) {
    let payload: { sub: number; type: string };
    try {
      payload = this.jwtService.verify<{ sub: number; type: string }>(
        tempToken,
      );
    } catch {
      throw new UnauthorizedException('Token expirado ou inválido');
    }
    if (payload.type !== '2fa')
      throw new UnauthorizedException('Token inválido');
    const user = await this.usuarioService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    const secret = (user as { twoFaSecret?: string | null }).twoFaSecret;
    const enabled = (user as { twoFaEnabled?: boolean }).twoFaEnabled;
    if (!enabled || !secret)
      throw new UnauthorizedException('2FA não está configurado');
    const { valid } = await otpVerify({
      strategy: 'totp',
      secret,
      token: code,
    });
    if (!valid) throw new UnauthorizedException('Código inválido');
    return this.generateTokens(user.codigo, user.nome, user.email);
  }

  /**
   * Emite tokens (access + refresh) para um usuário já autenticado por outro
   * meio — ex.: aceite de convite, onde a posse do link enviado por e-mail é
   * a prova de identidade (auto-login sem senha para usuário existente).
   */
  async issueTokens(codigo: number, nome: string, email: string) {
    return this.generateTokens(codigo, nome, email);
  }

  private async generateTokens(codigo: number, nome: string, email: string) {
    const payload = { sub: codigo, jti: randomUUID() };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    const salt = await bcrypt.genSalt();
    const hashedRT = await bcrypt.hash(refreshToken, salt);

    await this.prisma.refreshToken.create({
      data: {
        usrCodigo: codigo,
        hash: hashedRT,
        expiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { codigo, nome, email },
    };
  }
}
