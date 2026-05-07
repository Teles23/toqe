import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../usuario/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
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

    const payload = { sub: user.codigo };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        codigo: user.codigo,
        nome: user.nome,
        email: user.email,
      },
    };
  }
}
