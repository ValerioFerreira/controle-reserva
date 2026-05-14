import { Injectable } from '@nestjs/common';

// ─── Constantes ──────────────────────────────────────────────────────────────
const DATA_REFORMA = new Date(2022, 0, 1);    // 01/01/2022
const DATA_REFERENCIA = new Date(2021, 11, 31); // 31/12/2021
const DIAS_ANO = 365;

// Patentes oficiais — normalizar com .trim().toUpperCase() antes de comparar
const PATENTES_OFICIAIS = new Set([
  'CEL', 'CEL PROMO. REQ.',
  'TEN CEL', 'TEN CEL PROMO. REQ.',
  'MAJ QOC', 'MAJ QOA',
  'CAP QOA',
  '1ºTEN QOC', '1ºTEN QOA',
  '2ºTEN QOC', '2ºTEN QOA',
  '2ºTEN QOA PROMO. REQ.',
  'ASPIRANTE',
]);

// ─── Interface ───────────────────────────────────────────────────────────────
interface DadosReserva {
  dataIngresso: Date;
  dataNascimento: Date;
  dataUltimaPromocao: Date;
  sexo: string;         // 'M' ou 'F'
  postoGrad: string;    // já normalizado em uppercase

  // Averbações (dias)
  PMPE: number;
  FFAA: number;
  INSS: number;
  BM_outros_estados: number;
  PM_outros_estados: number;

  // Afastamentos (dias)
  ferias_n_gozadas: number;
  LTIP: number;

  // Calculados internamente
  classe?: 'O' | 'P';
  tempo_contrib_efetiva?: number;
  tempo_total?: number;
}

// ─── Utilitários de data ─────────────────────────────────────────────────────
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function diffDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

// ─── Pedágio de 17% (Art. 89-A, I) — apenas para PRÉ-REFORMA ────────────────
function calcularPedagio17(
  dataIngresso: Date,
  sexo: string,
  tempos: DadosReserva,
): Date {
  const tempoNecessario = sexo === 'F' ? 25 * DIAS_ANO : 30 * DIAS_ANO;

  const tempoAteReferencia =
    tempos.PMPE +
    tempos.FFAA +
    tempos.INSS +
    tempos.BM_outros_estados +
    tempos.PM_outros_estados +
    diffDays(dataIngresso, DATA_REFERENCIA) +
    tempos.ferias_n_gozadas -
    tempos.LTIP;

  const diasFaltantes = tempoNecessario - tempoAteReferencia;

  // Se já tinha tempo suficiente na data de referência, diasPedagio pode ser negativo
  const diasPedagio = diasFaltantes > 0 ? diasFaltantes * 1.17 : diasFaltantes;

  // Data em que completaria o tempo mínimo sem pedágio
  const dataBase = addYears(
    dataIngresso,
    sexo === 'F' ? 25 : 30,
  );

  // Pedágio de 17%
  const diasAcrescimo =
    diasFaltantes > 0
      ? diasFaltantes * 0.17
      : 0;

  return addDays(dataBase, diasAcrescimo);
}

// ─── Pedágio pela Tabela do Anexo Único — apenas PRÉ-REFORMA, apenas homens ──
function calcularPedagioTabela(
  dataBase: Date,
  dataIngresso: Date,
  tempoTotal: number,
  tempoEfetivo: number,
  sexo: string,
  tempos: DadosReserva,
): Date {
  if (sexo === 'F') return new Date(9999, 11, 31);

  // O tempo considerado para o pedágio da tabela é o tempo na DATA_REFERENCIA (31/12/2021)
  const tempoAteReferenciaTotal =
    tempos.PMPE +
    tempos.FFAA +
    tempos.INSS +
    tempos.BM_outros_estados +
    tempos.PM_outros_estados +
    diffDays(dataIngresso, DATA_REFERENCIA) +
    tempos.ferias_n_gozadas -
    tempos.LTIP;

  const tempoAteReferenciaEfetivo =
    diffDays(dataIngresso, DATA_REFERENCIA) +
    tempos.PMPE +
    tempos.ferias_n_gozadas -
    tempos.LTIP;

  const anosEfetivo = tempoAteReferenciaEfetivo / DIAS_ANO;
  const anosServico = tempoAteReferenciaTotal / DIAS_ANO;

  // Precisa ter ao menos 25 anos efetivos
  if (anosEfetivo < 25) return new Date(9999, 11, 31);

  // Anos completos faltantes para 30
  const anosFaltantes = Math.floor(30 - anosServico);

  if (anosFaltantes <= 0) return dataBase;

  // 4 meses por ano faltante, máximo de 60 meses (5 anos)
  const mesesAcrescimo = Math.min(anosFaltantes * 4, 60);

  return addMonths(dataBase, mesesAcrescimo);
}

// ─── DATA REQUERIDA ───────────────────────────────────────────────────────────
function calcularDataRequerida(r: DadosReserva): Date {
  const hoje = today();

  // ── PÓS-REFORMA (ingresso >= 01/01/2022) ──
  if (r.dataIngresso >= DATA_REFORMA) {
    const dias35Total = 35 * DIAS_ANO - r.tempo_total;
    const dias30Efetivo = 30 * DIAS_ANO - r.tempo_contrib_efetiva;

    const data35 = addDays(hoje, Math.max(dias35Total, 0));
    const data30 = addDays(hoje, Math.max(dias30Efetivo, 0));

    return data35 > data30 ? data35 : data30;
  }

  // ── PRÉ-REFORMA (ingresso < 01/01/2022) ──
  // dataBase = ponto de partida para pedágio tabela (ingresso + anos mínimos)
  // Data em que completa 25 anos de efetivo serviço
  const tempoEfetivoAteReferencia =
    diffDays(r.dataIngresso, DATA_REFERENCIA) +
    r.PMPE +
    r.ferias_n_gozadas -
    r.LTIP;

  const diasFaltando25Efetivo =
    25 * DIAS_ANO - tempoEfetivoAteReferencia;

  const dataBase = addDays(
    DATA_REFERENCIA,
    Math.max(diasFaltando25Efetivo, 0),
  );

  const dataPedagio17 = calcularPedagio17(r.dataIngresso, r.sexo, r);
  const dataPedagioTabela = calcularPedagioTabela(
    dataBase,
    r.dataIngresso,
    r.tempo_total,
    r.tempo_contrib_efetiva,
    r.sexo,
    r,
  );

  const datasValidas: Date[] = [];

  if (dataPedagio17.getFullYear() < 9999) datasValidas.push(dataPedagio17);
  if (dataPedagioTabela.getFullYear() < 9999) datasValidas.push(dataPedagioTabela);

  if (!datasValidas.length) throw new Error('Nenhuma data requerida válida.');

  // A mais futura entre as datas válidas (ou a mais benefica?)
  // Geralmente a regra de transição permite optar pela mais benéfica.
  const dataFinal = new Date(Math.max(...datasValidas.map((d) => d.getTime())));

  console.log(`[DEBUG-PEDAGIO] Classe: ${r.classe}, Ingresso: ${r.dataIngresso.toISOString().split('T')[0]}, TotalHoje: ${Math.floor(r.tempo_total / DIAS_ANO)}a, EfHoje: ${Math.floor(r.tempo_contrib_efetiva / DIAS_ANO)}a | DataBase: ${dataBase.toISOString().split('T')[0]} | P17: ${dataPedagio17.toISOString().split('T')[0]} | PTabela: ${dataPedagioTabela.toISOString().split('T')[0]} -> Final: ${dataFinal.toISOString().split('T')[0]}`);

  return dataFinal;
}

// ─── DATA COMPULSÓRIA (Art. 90) ───────────────────────────────────────────────
function calcularDataCompulsoria(r: DadosReserva, dataRequerida: Date): Date {
  const patente = r.postoGrad.trim().toUpperCase();
  const posReforma = r.dataIngresso >= DATA_REFORMA;

  // ── IDADE LIMITE (teto absoluto) ──
  const idadeLimite = r.classe === 'O' ? 67 : 65;
  const dataIdade = addYears(r.dataNascimento, idadeLimite);

  // ── PATENTES SEM GRUPO ESPECIAL ──
  const especiais3ou2 = ['CEL', 'CEL PROMO. REQ.', 'MAJ QOA', 'SUBTEN', 'SUBTEN PROMO. REQ.'];
  const especiais5ou4 = ['TEN CEL', 'TEN CEL PROMO. REQ.', 'CAP QOA'];

  let anosPosto = 0;

  if (especiais3ou2.includes(patente)) {
    anosPosto = posReforma ? 3 : 2;
  } else if (especiais5ou4.includes(patente)) {
    anosPosto = posReforma ? 5 : 4;
  } else {
    // Sem grupo especial: compulsória = apenas idade
    return dataIdade;
  }

  // ── DATA PELO POSTO ──
  const dataPosto = addYears(r.dataUltimaPromocao, anosPosto);

  // ── COMPULSÓRIA BRUTA = MIN(posto, idade) ──
  const dataCompulsoriaBruta = dataPosto < dataIdade ? dataPosto : dataIdade;

  // ── COMPULSÓRIA FINAL = MAX(bruta, requerida) ──
  // Se a requerida ainda não chegou quando o posto vence,
  // o militar aguarda a requerida (limitado pela idade)
  const dataCompulsoriaFinal = dataCompulsoriaBruta > dataRequerida
    ? dataCompulsoriaBruta
    : dataRequerida;

  // Idade é teto absoluto — nunca ultrapassa
  return dataCompulsoriaFinal < dataIdade ? dataCompulsoriaFinal : dataIdade;
}

// ─── FUNÇÃO PRINCIPAL ────────────────────────────────────────────────────────
@Injectable()
export class ReservaService {
  calcularDatasReserva(
    militar: {
      dataIngresso: Date;
      dataNascimento: Date;
      dataUltimaPromocao: Date;
      sexo: string;
      postoGrad: string;
      pcnh?: boolean;
    },
    averbacoes: Array<{ tipo: string; dias: number }>,
    afastamentos: Array<{ tipo: string; dias: number }>,
  ): {
    ok: boolean;
    reservaRequerimento?: Date;
    reservaCompulsoria?: Date;
    aviso?: string;
  } {
    // Validação
    if (!militar.dataIngresso) return { ok: false, aviso: 'Data de ingresso não informada' };
    if (!militar.dataNascimento) return { ok: false, aviso: 'Data de nascimento não informada' };
    if (!militar.sexo) return { ok: false, aviso: 'Sexo não informado' };
    if (!militar.dataUltimaPromocao) return { ok: false, aviso: 'Data da última promoção não informada' };

    // Somar dias por tipo de averbação
    const PMPE = averbacoes
      .filter((a) => a.tipo === 'PMPE')
      .reduce((s, a) => s + a.dias, 0);
    const FFAA = averbacoes
      .filter((a) => a.tipo === 'FFAA')
      .reduce((s, a) => s + a.dias, 0);
    const INSS = averbacoes
      .filter((a) => a.tipo === 'INSS')
      .reduce((s, a) => s + a.dias, 0);
    const BM_outros_estados = averbacoes
      .filter((a) => a.tipo === 'BM DE OUTROS ESTADOS')
      .reduce((s, a) => s + a.dias, 0);
    const PM_outros_estados = averbacoes
      .filter((a) => a.tipo === 'PM DE OUTROS ESTADOS')
      .reduce((s, a) => s + a.dias, 0);

    // Somar dias por tipo de afastamento
    const ferias_n_gozadas = afastamentos
      .filter((a) => a.tipo === 'FÉRIAS NÃO GOZADAS')
      .reduce((s, a) => s + a.dias, 0);
    const LTIP = afastamentos
      .filter((a) => a.tipo === 'LTIP')
      .reduce((s, a) => s + a.dias, 0);

    // Normalização obrigatória da patente (ADENDO 1)
    const postoGradNorm = militar.postoGrad.trim().toUpperCase();

    const r: DadosReserva = {
      dataIngresso: new Date(militar.dataIngresso),
      dataNascimento: new Date(militar.dataNascimento),
      dataUltimaPromocao: new Date(militar.dataUltimaPromocao),
      sexo: militar.sexo,
      postoGrad: postoGradNorm,
      PMPE,
      FFAA,
      INSS,
      BM_outros_estados,
      PM_outros_estados,
      ferias_n_gozadas,
      LTIP,
    };

    // Classificar como Oficial ou Praça (ADENDO 1: sempre com uppercase)
    r.classe = PATENTES_OFICIAIS.has(postoGradNorm) ? 'O' : 'P';

    // ADENDO 2: LTIP subtraído no efetivo, somado no total (comportamento intencional)
    r.tempo_contrib_efetiva =
      diffDays(r.dataIngresso, today()) +
      r.PMPE +
      r.ferias_n_gozadas -
      r.LTIP;

    r.tempo_total =
      r.tempo_contrib_efetiva +
      r.FFAA +
      r.BM_outros_estados +
      r.PM_outros_estados +
      r.INSS +
      r.LTIP;

    try {
      const requerida = calcularDataRequerida(r);
      let compulsoria = calcularDataCompulsoria(r, requerida);

      if (militar.pcnh) {
        compulsoria = addMonths(r.dataUltimaPromocao, 2);
      }

      // Regra final: requerida nunca pode ser posterior à compulsória
      const reservaRequerimento =
        requerida.getTime() > compulsoria.getTime() ? compulsoria : requerida;

      return {
        ok: true,
        reservaRequerimento,
        reservaCompulsoria: compulsoria,
      };
    } catch (err) {
      return { ok: false, aviso: err.message };
    }
  }
}
