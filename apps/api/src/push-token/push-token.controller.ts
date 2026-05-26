import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PushTokenService } from './push-token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtRequest } from '../common/types/jwt-request';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const registerTokenSchema = z.object({
  token: z.string().min(1).max(255),
  plataforma: z.enum(['ios', 'android', 'unknown']).default('unknown'),
});

const deleteTokenSchema = z.object({
  token: z.string().min(1).max(255),
});

class RegisterTokenDto extends createZodDto(registerTokenSchema) {}
class DeleteTokenDto extends createZodDto(deleteTokenSchema) {}

@ApiTags('Push Tokens')
@ApiBearerAuth('JWT')
@Controller('push-tokens')
@UseGuards(JwtAuthGuard)
export class PushTokenController {
  constructor(private readonly pushTokenService: PushTokenService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra token de push notification do dispositivo',
  })
  @ApiResponse({ status: 201, description: 'Token registrado.' })
  register(@Body() dto: RegisterTokenDto, @Request() req: JwtRequest) {
    return this.pushTokenService.upsertToken(
      req.user.sub,
      dto.token,
      dto.plataforma,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove token de push notification' })
  @ApiResponse({ status: 204, description: 'Token removido.' })
  remove(@Body() dto: DeleteTokenDto, @Request() req: JwtRequest) {
    return this.pushTokenService.deleteToken(req.user.sub, dto.token);
  }
}
