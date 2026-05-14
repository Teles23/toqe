import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentoService } from './agendamento.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificacaoProducer } from '../notificacao/notificacao.producer';
import { AgendaGateway } from '../agenda/agenda.gateway';

describe('AgendamentoService', () => {
  let service: AgendamentoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgendamentoService,
        { provide: PrismaService, useValue: {} },
        { provide: NotificacaoProducer, useValue: {} },
        { provide: AgendaGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<AgendamentoService>(AgendamentoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
