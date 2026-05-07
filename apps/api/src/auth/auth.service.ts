import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../usuario/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(dto: CreateUserDto) {
    return this.usuarioService.create(dto);
  }

  async login(dto: LoginDto) {
    const user = await this.usuarioService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.senha, user.senhaHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateTokens(user.codigo, user.nome, user.email);
  }

  async refresh(dto: RefreshTokenDto) {
    // 1. Busca tokens válidos no banco
    // Nota: Em produção, o ideal é usar Redis para tokens por performance
    const tokens = await this.prisma.refreshToken.findMany({
      where: { revogado: false, expiraEm: { gt: new Date() } },
    });

    let foundToken = null;
    for (const t of tokens) {
      const match = await bcrypt.compare(dto.refreshToken, t.hash);
      if (match) {
        foundToken = t;
        break;
      }
    }

    if (!foundToken) {
      throw new UnauthorizedException('Token de atualização inválido ou expirado');
    }

    // 2. Revoga o token atual (rotação)
    await this.prisma.refreshToken.update({
      where: { codigo: foundToken.codigo },
      data: { revogado: true },
    });

    // 3. Gera novos tokens
    const user = await this.usuarioService.findById(foundToken.usrCodigo);
    return this.generateTokens(user.codigo, user.nome, user.email);
  }

  private async generateTokens(codigo: number, nome: string, email: string) {
    const payload = { sub: codigo };
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
