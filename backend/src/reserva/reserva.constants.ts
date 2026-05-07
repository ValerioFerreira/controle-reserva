import { PostoGrad } from './reserva.types';

export const DIAS_ANO = 365;
export const DATA_REFORMA = new Date('2022-01-01T00:00:00.000Z');
export const DATA_REFERENCIA = new Date('2021-12-31T00:00:00.000Z');

export const LIMITE_IDADE_OFICIAL_ANOS = 67;
export const LIMITE_IDADE_PRACA_ANOS = 65;

export const POSTOS_TEMPO_3_2 = new Set<PostoGrad>([
  PostoGrad.CEL,
  PostoGrad.MAJ_QOA,
  PostoGrad.SUBTEN,
]);

export const POSTOS_TEMPO_5_4 = new Set<PostoGrad>([
  PostoGrad.TEN_CEL,
  PostoGrad.CAP_QOA,
]);
