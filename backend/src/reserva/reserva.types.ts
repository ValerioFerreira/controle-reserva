export enum PostoGrad {
  CEL = 'CEL',
  TEN_CEL = 'TEN_CEL',
  MAJ_QOC = 'MAJ_QOC',
  MAJ_QOA = 'MAJ_QOA',
  CAP_QOA = 'CAP_QOA',
  PRIMEIRO_TEN_QOC = 'PRIMEIRO_TEN_QOC',
  PRIMEIRO_TEN_QOA = 'PRIMEIRO_TEN_QOA',
  SEGUNDO_TEN_QOC = 'SEGUNDO_TEN_QOC',
  SEGUNDO_TEN_QOA = 'SEGUNDO_TEN_QOA',
  ASPIRANTE = 'ASPIRANTE',
  SUBTEN = 'SUBTEN',
  PRIMEIRO_SGT = 'PRIMEIRO_SGT',
  SEGUNDO_SGT = 'SEGUNDO_SGT',
  TERCEIRO_SGT = 'TERCEIRO_SGT',
  CB = 'CB',
  SD = 'SD',
}

export type ClasseMilitar = 'O' | 'P';

export enum TipoAverbacao {
  INSS = 'INSS',
  FFAA = 'FFAA',
  PMPE = 'PMPE',
  PM_OUTROS_ESTADOS = 'PM DE OUTROS ESTADOS',
  BM_OUTROS_ESTADOS = 'BM DE OUTROS ESTADOS',
}

export enum TipoAfastamento {
  FERIAS_NAO_GOZADAS = 'FÉRIAS NÃO GOZADAS',
  LTIP = 'LTIP',
}

export interface TempoExtras {
  inssDias: number;
  ffaaDias: number;
  pmpeDias: number;
  pmOutrosEstadosDias: number;
  bmOutrosEstadosDias: number;
  feriasNaoGozadasDias: number;
  ltipDias: number;
}

export interface CalculoReservaInput {
  postoGrad: PostoGrad;
  classe: ClasseMilitar;
  sexo: 'M' | 'F';
  dataIngresso: Date;
  dataUltimaPromocao: Date;
  dataNascimento: Date;
  dataBaseCalculo?: Date;
  extras: TempoExtras;
}
