import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('barbearias')
export class BarbeariaController {
  constructor(private readonly barbeariaService: BarbeariaService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateBarbeariaDto, @Request() req) {
    return this.barbeariaService.create(dto, req.user.sub);
  }
}
