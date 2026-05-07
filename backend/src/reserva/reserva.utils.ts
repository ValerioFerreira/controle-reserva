import { BadRequestException } from '@nestjs/common';
import { ClasseMilitar, PostoGrad } from './reserva.types';

function sanitize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const POSTO_MAP: Record<string, PostoGrad> = {
  CEL: PostoGrad.CEL,
  'CEL PROMO REQ': PostoGrad.CEL,
  'TEN CEL': PostoGrad.TEN_CEL,
  'TEN CEL PROMO REQ': PostoGrad.TEN_CEL,
  'MAJ QOC': PostoGrad.MAJ_QOC,
  'MAJ QOA': PostoGrad.MAJ_QOA,
  'CAP QOA': PostoGrad.CAP_QOA,
  '1TEN QOC': PostoGrad.PRIMEIRO_TEN_QOC,
  '1TEN QOA': PostoGrad.PRIMEIRO_TEN_QOA,
  '2TEN QOC': PostoGrad.SEGUNDO_TEN_QOC,
  '2TEN QOA': PostoGrad.SEGUNDO_TEN_QOA,
  ASPIRANTE: PostoGrad.ASPIRANTE,
  SUBTEN: PostoGrad.SUBTEN,
  'SUBTEN PROMO REQ': PostoGrad.SUBTEN,
  '1SGT': PostoGrad.PRIMEIRO_SGT,
  '2SGT': PostoGrad.SEGUNDO_SGT,
  '3SGT': PostoGrad.TERCEIRO_SGT,
  CB: PostoGrad.CB,
  SD: PostoGrad.SD,
};

const OFICIAIS = new Set<PostoGrad>([
  PostoGrad.ASPIRANTE,
  PostoGrad.SEGUNDO_TEN_QOC,
  PostoGrad.SEGUNDO_TEN_QOA,
  PostoGrad.PRIMEIRO_TEN_QOC,
  PostoGrad.PRIMEIRO_TEN_QOA,
  PostoGrad.CAP_QOA,
  PostoGrad.MAJ_QOC,
  PostoGrad.MAJ_QOA,
  PostoGrad.TEN_CEL,
  PostoGrad.CEL,
]);

export function normalizarPostoGrad(raw: string): PostoGrad {
  const sanitized = sanitize(raw)
    .replace('1º', '1')
    .replace('2º', '2')
    .replace('3º', '3');
  const mapped = POSTO_MAP[sanitized];
  if (!mapped) {
    throw new BadRequestException(`Posto/graduação inválido: ${raw}`);
  }
  return mapped;
}

export function definirClasse(postoGrad: PostoGrad): ClasseMilitar {
  return OFICIAIS.has(postoGrad) ? 'O' : 'P';
}

export function parsePtBrDate(value: string): Date {
  const [day, month, year] = value.split('/').map((p) => Number(p));
  if (!day || !month || !year) {
    throw new BadRequestException(`Data inválida: ${value}`);
  }
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + Math.floor(days));
  return next;
}

export function maxDate(...dates: Date[]): Date {
  return dates.reduce((a, b) => (a > b ? a : b));
}

export function minDate(...dates: Date[]): Date {
  return dates.reduce((a, b) => (a < b ? a : b));
}
