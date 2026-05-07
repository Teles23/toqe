import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const salt = await bcrypt.genSalt();
    const senhaHash = await bcrypt.hash(dto.senha, salt);

    return this.prisma.usuario.create({
      data: {
        nome: dto.nome,
        email: dto.email,
        senhaHash: senhaHash,
      },
      select: {
        codigo: true,
        nome: true,
        email: true,
        criadoEm: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
    });
  }

  async findById(codigo: number) {
    return this.prisma.usuario.findUnique({
      where: { codigo },
    });
  }
}
