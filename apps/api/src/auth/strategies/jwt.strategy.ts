import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioService } from '../../usuario/usuario.service';

interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usuarioService: UsuarioService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        if (!process.env.JWT_SECRET)
          throw new Error(
            'JWT_SECRET env var is required and must not be empty',
          );
        return process.env.JWT_SECRET;
      })(),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usuarioService.findById(payload.sub);
    // Rejeita tokens de usuários inexistentes OU desativados
    if (!user || !user.ativo) {
      throw new UnauthorizedException();
    }
    return { sub: user.codigo, email: user.email, superAdmin: user.superAdmin };
  }
}
