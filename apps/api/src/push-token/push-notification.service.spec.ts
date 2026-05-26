import { Test } from '@nestjs/testing';
import { PushNotificationService } from './push-notification.service';
import { PushTokenService } from './push-token.service';

// Mock expo-server-sdk before importing the service
const mockSendPushNotificationsAsync = jest.fn();
const mockChunkPushNotifications = jest.fn();

jest.mock('expo-server-sdk', () => {
  const isExpoPushToken = jest.fn((token: string) =>
    token.startsWith('ExponentPushToken['),
  );

  const Expo = jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: mockSendPushNotificationsAsync,
    chunkPushNotifications: mockChunkPushNotifications,
  }));

  (
    Expo as unknown as { isExpoPushToken: typeof isExpoPushToken }
  ).isExpoPushToken = isExpoPushToken;

  return { Expo };
});

const mockPushTokenService = {
  findByUser: jest.fn(),
};

describe('PushNotificationService', () => {
  let service: PushNotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        { provide: PushTokenService, useValue: mockPushTokenService },
      ],
    }).compile();
    service = module.get(PushNotificationService);
  });

  it('não chama expo quando o usuário não tem tokens', async () => {
    mockPushTokenService.findByUser.mockResolvedValue([]);

    await service.send(1, 'Título', 'Corpo');

    expect(mockChunkPushNotifications).not.toHaveBeenCalled();
    expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled();
  });

  it('filtra tokens inválidos e não chama expo quando nenhum é válido', async () => {
    mockPushTokenService.findByUser.mockResolvedValue([
      'token-invalido',
      'outro-invalido',
    ]);

    await service.send(1, 'Título', 'Corpo');

    expect(mockChunkPushNotifications).not.toHaveBeenCalled();
    expect(mockSendPushNotificationsAsync).not.toHaveBeenCalled();
  });

  it('chama sendPushNotificationsAsync para tokens Expo válidos', async () => {
    const validToken = 'ExponentPushToken[xxx]';
    mockPushTokenService.findByUser.mockResolvedValue([validToken]);

    const chunk = [{ to: validToken, title: 'Título', body: 'Corpo' }];
    mockChunkPushNotifications.mockReturnValue([chunk]);
    mockSendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

    await service.send(1, 'Título', 'Corpo');

    expect(mockChunkPushNotifications).toHaveBeenCalledWith([
      { to: validToken, title: 'Título', body: 'Corpo', data: undefined },
    ]);
    expect(mockSendPushNotificationsAsync).toHaveBeenCalledWith(chunk);
  });

  it('captura falha de expo e não propaga a exceção', async () => {
    const validToken = 'ExponentPushToken[yyy]';
    mockPushTokenService.findByUser.mockResolvedValue([validToken]);

    const chunk = [{ to: validToken, title: 'T', body: 'B' }];
    mockChunkPushNotifications.mockReturnValue([chunk]);
    mockSendPushNotificationsAsync.mockRejectedValue(
      new Error('Expo service unavailable'),
    );

    // Não deve lançar
    await expect(service.send(1, 'T', 'B')).resolves.toBeUndefined();
  });

  it('envia data opcional junto com a notificação', async () => {
    const validToken = 'ExponentPushToken[zzz]';
    const extraData = { tipo: 'agendamento', id: 42 };
    mockPushTokenService.findByUser.mockResolvedValue([validToken]);

    mockChunkPushNotifications.mockReturnValue([[{ to: validToken }]]);
    mockSendPushNotificationsAsync.mockResolvedValue([{ status: 'ok' }]);

    await service.send(1, 'T', 'B', extraData);

    expect(mockChunkPushNotifications).toHaveBeenCalledWith([
      expect.objectContaining({ data: extraData }),
    ]);
  });

  it('processa múltiplos chunks sequencialmente', async () => {
    const token1 = 'ExponentPushToken[aaa]';
    const token2 = 'ExponentPushToken[bbb]';
    mockPushTokenService.findByUser.mockResolvedValue([token1, token2]);

    const chunk1 = [{ to: token1 }];
    const chunk2 = [{ to: token2 }];
    mockChunkPushNotifications.mockReturnValue([chunk1, chunk2]);
    mockSendPushNotificationsAsync
      .mockResolvedValueOnce([{ status: 'ok' }])
      .mockResolvedValueOnce([{ status: 'ok' }]);

    await service.send(1, 'T', 'B');

    expect(mockSendPushNotificationsAsync).toHaveBeenCalledTimes(2);
  });
});
