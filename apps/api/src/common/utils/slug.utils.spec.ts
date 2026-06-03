import { slugify, linkPublicoBarbeiro } from './slug.utils';

describe('slug.utils', () => {
  describe('slugify', () => {
    it('converte para minúsculas e separa por hífen', () => {
      expect(slugify('Carlos Mendes')).toBe('carlos-mendes');
    });

    it('remove acentos (NFD)', () => {
      expect(slugify('João Conceição')).toBe('joao-conceicao');
      expect(slugify('Almoço')).toBe('almoco');
    });

    it('colapsa separadores e apara hífens nas pontas', () => {
      expect(slugify('  Ana   Maria!!  ')).toBe('ana-maria');
      expect(slugify('--Beto--')).toBe('beto');
    });

    it('retorna string vazia para entrada sem alfanuméricos', () => {
      expect(slugify('@#$%')).toBe('');
    });
  });

  describe('linkPublicoBarbeiro', () => {
    const ORIGINAL_PUBLIC_BOOKING_DOMAIN = process.env.PUBLIC_BOOKING_DOMAIN;

    beforeEach(() => {
      process.env.PUBLIC_BOOKING_DOMAIN = 'toqe.app';
    });

    afterEach(() => {
      if (ORIGINAL_PUBLIC_BOOKING_DOMAIN === undefined) {
        delete process.env.PUBLIC_BOOKING_DOMAIN;
      } else {
        process.env.PUBLIC_BOOKING_DOMAIN = ORIGINAL_PUBLIC_BOOKING_DOMAIN;
      }
    });

    it('monta o link público a partir do nome', () => {
      expect(linkPublicoBarbeiro('Carlos Mendes')).toBe(
        'https://toqe.app/u/carlos-mendes',
      );
    });

    it('usa fallback quando o nome não gera slug', () => {
      expect(linkPublicoBarbeiro('###')).toBe('https://toqe.app/u/barbeiro');
    });

    it('não duplica protocolo quando a variável já tem https', () => {
      process.env.PUBLIC_BOOKING_DOMAIN = 'https://app.toqe-barber.com.br/';
      expect(linkPublicoBarbeiro('Ana')).toBe(
        'https://app.toqe-barber.com.br/u/ana',
      );
    });
  });
});
