import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BarbeariaService } from './barbearia.service';
import { CreateBarbeariaDto } from './dto/create-barbearia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Barbearias')
@ApiBearerAuth('JWT')
@Controller('barbearias')
@UseGuards(JwtAuthGuard)
export class BarbeariaController {
  constructor(private readonly barbeariaService: BarbeariaService) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova barbearia e define o usuário como DONO' })
  @ApiResponse({ status: 201, description: 'Barbearia criada.' })
  @ApiResponse({ status: 400, description: 'Slug já está em uso.' })
  create(@Body() dto: CreateBarbeariaDto, @Request() req) {
    return this.barbeariaService.create(dto, req.user.sub);
  }
}
