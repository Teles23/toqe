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
    it('monta o link público a partir do nome', () => {
      expect(linkPublicoBarbeiro('Carlos Mendes')).toBe(
        'toqe.app/u/carlos-mendes',
      );
    });

    it('usa fallback quando o nome não gera slug', () => {
      expect(linkPublicoBarbeiro('###')).toBe('toqe.app/u/barbeiro');
    });
  });
});
