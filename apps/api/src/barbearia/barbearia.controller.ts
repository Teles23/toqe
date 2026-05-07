import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from '@nestjs/common';

@Controller('barbearias')
@UseGuards(JwtAuthGuard)
export class BarbeariaController {
  constructor(private readonly barbeariaService: BarbeariaService) {}

  @Post()
  create(@Body() dto: CreateBarbeariaDto, @Request() req) {
    // Rota global (pré-tenant): qualquer usuário logado pode criar sua barbearia
    return this.barbeariaService.create(dto, req.user.sub);
  }
}
