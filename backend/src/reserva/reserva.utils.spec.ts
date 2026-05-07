import { PostoGrad } from './reserva.types';
import { definirClasse, normalizarPostoGrad, parsePtBrDate } from './reserva.utils';

describe('reserva.utils', () => {
  it('normaliza posto/grad corretamente', () => {
    expect(normalizarPostoGrad('Ten Cel Promo. Req.')).toBe(PostoGrad.TEN_CEL);
    expect(normalizarPostoGrad('1ºTen QOA')).toBe(PostoGrad.PRIMEIRO_TEN_QOA);
  });

  it('define classe corretamente', () => {
    expect(definirClasse(PostoGrad.CEL)).toBe('O');
    expect(definirClasse(PostoGrad.SUBTEN)).toBe('P');
  });

  it('parseia data pt-BR', () => {
    const date = parsePtBrDate('31/12/2021');
    expect(date.toISOString()).toContain('2021-12-31');
  });
});
