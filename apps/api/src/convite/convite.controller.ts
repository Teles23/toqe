import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConviteService } from './convite.service';
import { AceitarConviteDto } from './dto/aceitar-convite.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Convite')
@Controller('convite')
export class ConviteController {
  constructor(private readonly conviteService: ConviteService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Get(':token')
  @ApiOperation({ summary: 'Obtém informações de um convite pelo token' })
  @ApiResponse({ status: 200, description: 'Convite encontrado.' })
  @ApiResponse({
    status: 404,
    description: 'Convite não encontrado ou expirado.',
  })
  obterConvite(@Param('token') token: string) {
    return this.conviteService.obterConvite(token);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post(':token/aceitar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Aceita um convite, cria/vincula usuário e faz auto-login (retorna tokens)',
  })
  @ApiResponse({
    status: 200,
    description: 'Convite aceito. Retorna access/refresh tokens (auto-login).',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou convite já utilizado.',
  })
  @ApiResponse({
    status: 404,
    description: 'Convite não encontrado ou expirado.',
  })
  aceitarConvite(
    @Param('token') token: string,
    @Body() dto: AceitarConviteDto,
  ) {
    return this.conviteService.aceitarConvite(token, dto);
  }

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Delete(':token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rejeita um convite (remove o token)' })
  @ApiResponse({ status: 200, description: 'Convite rejeitado.' })
  rejeitarConvite(@Param('token') token: string) {
    return this.conviteService.rejeitarConvite(token);
  }
}
