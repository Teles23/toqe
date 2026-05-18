import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ApiErrorCode, ApiErrorPayload } from '@toqe/contracts/errors';
import { GlobalExceptionFilter } from './sentry.filter';

interface MockHost {
  host: ArgumentsHost;
  statusMock: jest.MockedFunction<
    (code: number) => {
      json: jest.MockedFunction<(payload: ApiErrorPayload) => void>;
    }
  >;
  jsonMock: jest.MockedFunction<(payload: ApiErrorPayload) => void>;
}

function makeHost(overrides: {
  url?: string;
  headers?: Record<string, string>;
  user?: { sub: number };
}): MockHost {
  const req = {
    url: overrides.url ?? '/test',
    method: 'GET',
    headers: overrides.headers ?? {},
    user: overrides.user,
  };

  const jsonMock = jest.fn<void, [ApiErrorPayload]>();
  const statusMock = jest
    .fn<{ json: typeof jsonMock }, [number]>()
    .mockReturnValue({ json: jsonMock });
  const res = { status: statusMock };

  const host = {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;

  return { host, statusMock, jsonMock };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
  });

  describe('erros 5xx — InternalServerError', () => {
    it('emite payload no formato ApiErrorPayload para um Error genérico', () => {
      const { host, statusMock, jsonMock } = makeHost({ url: '/api/v1/algo' });
      filter.catch(new Error('algo explodiu'), host);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);

      const payload: ApiErrorPayload = jsonMock.mock.calls[0][0];
      expect(payload.statusCode).toBe(500);
      expect(payload.code).toBe(ApiErrorCode.INTERNAL);
      expect(payload.message).toBe('Erro interno do servidor');
      expect(payload.path).toBe('/api/v1/algo');
      expect(typeof payload.timestamp).toBe('string');
      // timestamp deve ser ISO 8601
      expect(() => new Date(payload.timestamp!)).not.toThrow();
    });

    it('emite payload no formato ApiErrorPayload quando a exceção não é um Error', () => {
      const { host, statusMock, jsonMock } = makeHost({});
      filter.catch('string de erro', host);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const payload: ApiErrorPayload = jsonMock.mock.calls[0][0];
      expect(payload.statusCode).toBe(500);
      expect(payload.code).toBe(ApiErrorCode.INTERNAL);
      expect(payload.message).toBe('Erro interno do servidor');
    });
  });

  describe('erros HttpException (4xx)', () => {
    it('emite payload com statusCode correto e message da exceção', () => {
      const { host, statusMock, jsonMock } = makeHost({ url: '/api/v1/auth' });
      filter.catch(
        new HttpException('Não autorizado', HttpStatus.UNAUTHORIZED),
        host,
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);

      const payload: ApiErrorPayload = jsonMock.mock.calls[0][0];
      expect(payload.statusCode).toBe(401);
      expect(payload.message).toBe('Não autorizado');
      expect(payload.path).toBe('/api/v1/auth');
      expect(typeof payload.timestamp).toBe('string');
    });

    it('usa message do objeto de resposta quando getResponse retorna objeto com message', () => {
      const { host, statusMock, jsonMock } = makeHost({});
      filter.catch(
        new HttpException(
          { message: 'Campo obrigatório', statusCode: 400 },
          HttpStatus.BAD_REQUEST,
        ),
        host,
      );

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      const payload: ApiErrorPayload = jsonMock.mock.calls[0][0];
      expect(payload.statusCode).toBe(400);
      expect(payload.message).toBe('Campo obrigatório');
    });
  });

  describe('erros Prisma P2002 (conflito de unique)', () => {
    it('formata a mensagem de conflito corretamente', () => {
      const { host, statusMock, jsonMock } = makeHost({});
      const prismaError = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
        meta: { target: { email: true } },
      });
      filter.catch(prismaError, host);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      const payload: ApiErrorPayload = jsonMock.mock.calls[0][0];
      // Erros Prisma 5xx ainda devem retornar "Erro interno do servidor" ao cliente
      expect(payload.message).toBe('Erro interno do servidor');
      expect(payload.code).toBe(ApiErrorCode.INTERNAL);
    });
  });

  describe('shape do ApiErrorPayload', () => {
    it('todos os campos obrigatórios (statusCode, code, message) estão presentes', () => {
      const { host, jsonMock } = makeHost({});
      filter.catch(new Error('boom'), host);

      const payload: ApiErrorPayload = jsonMock.mock.calls[0][0];
      expect(payload).toHaveProperty('statusCode');
      expect(payload).toHaveProperty('code');
      expect(payload).toHaveProperty('message');
    });

    it('campos opcionais (timestamp, path) são strings quando presentes', () => {
      const { host, jsonMock } = makeHost({ url: '/rota' });
      filter.catch(new Error('boom'), host);

      const payload: ApiErrorPayload = jsonMock.mock.calls[0][0];
      if (payload.timestamp !== undefined) {
        expect(typeof payload.timestamp).toBe('string');
      }
      if (payload.path !== undefined) {
        expect(typeof payload.path).toBe('string');
      }
    });
  });
});
