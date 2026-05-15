import { Injectable } from '@nestjs/common';
import { differenceInDays, differenceInYears, addMonths, addYears, addDays } from 'date-fns';

// ─── Constantes ──────────────────────────────────────────────────────────────
const DATA_REFORMA = new Date(2022, 0, 1);    // 01/01/2022
const DATA_REFERENCIA = new Date(2021, 11, 31); // 31/12/2021

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

export interface AuditoriaReserva {
  dadosBase: any;
  temposCalculados: any;
  regra17?: any;
  regraTabela?: any;
  escolhaRequerida?: any;
  compulsoria?: any;
  pcnh?: any;
  precisaoTemporal: string[];
}

interface DadosReserva {
  dataIngresso: Date;
  dataNascimento: Date;
  dataUltimaPromocao: Date;
  sexo: string;
  postoGrad: string;
  pcnh?: boolean;

  PMPE: number;
  FFAA: number;
  INSS: number;
  BM_outros_estados: number;
  PM_outros_estados: number;
  ferias_n_gozadas: number;
  LTIP: number;

  classe?: 'O' | 'P';
  
  diasAverbacaoTotal: number;
  diasAverbacaoEfetivo: number;

  dataIngressoVirtualTotal: Date;
  dataIngressoVirtualEfetivo: Date;

  auditoria: AuditoriaReserva;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function logAudit(r: DadosReserva, msg: string) {
  r.auditoria.precisaoTemporal.push(msg);
}

// ─── Pedágio de 17% (Art. 89-A, I) — apenas para PRÉ-REFORMA ────────────────
function calcularPedagio17(r: DadosReserva): Date {
  const anosNecessarios = r.sexo === 'F' ? 25 : 30;
  
  // Data exata em que completaria os anos necessários (Tempo Total)
  const dataAlvoSemPedagio = addYears(r.dataIngressoVirtualTotal, anosNecessarios);
  
  // Quantos dias faltam de 31/12/2021 até essa data alvo
  const diasFaltantes = differenceInDays(dataAlvoSemPedagio, DATA_REFERENCIA);
  
  let diasPedagio = 0;
  let dataFinal = dataAlvoSemPedagio;

  if (diasFaltantes > 0) {
    // Pedágio de 17% sobre os dias faltantes
    const pedagioBruto = diasFaltantes * 0.17;
    diasPedagio = Math.round(pedagioBruto);
    dataFinal = addDays(dataAlvoSemPedagio, diasPedagio);
    
    logAudit(r, `Regra 17%: Usados dias reais do calendário. Faltavam ${diasFaltantes} dias em 31/12/2021. Pedágio: ${diasFaltantes} * 0.17 = ${pedagioBruto} dias. Arredondamento (Math.round) -> ${diasPedagio} dias.`);
  } else {
    logAudit(r, `Regra 17%: Requisito já cumprido antes de 31/12/2021. Dias faltantes <= 0. Pedágio = 0.`);
  }

  r.auditoria.regra17 = {
    dataAlvoSemPedagio: dataAlvoSemPedagio.toISOString().split('T')[0],
    diasFaltantesRef: diasFaltantes,
    diasPedagio,
    dataFinal: dataFinal.toISOString().split('T')[0]
  };

  return dataFinal;
}

// ─── Pedágio pela Tabela do Anexo Único — apenas PRÉ-REFORMA, apenas homens ──
function calcularPedagioTabela(r: DadosReserva): Date {
  if (r.sexo === 'F') {
    return new Date(9999, 11, 31);
  }

  const data25Efetivo = addYears(r.dataIngressoVirtualEfetivo, 25);
  
  if (differenceInDays(data25Efetivo, DATA_REFERENCIA) > 0) {
    r.auditoria.regraTabela = {
      aplicavel: false,
      motivo: `Não possuía 25 anos de efetivo em 31/12/2021. Completaria apenas em ${data25Efetivo.toISOString().split('T')[0]}.`
    };
    logAudit(r, `Regra da Tabela: Inaplicável (não fechou 25 anos de efetivo até 31/12/2021 usando data real do calendário).`);
    return new Date(9999, 11, 31);
  }

  // Quantos anos completos de tempo TOTAL ele tinha em 31/12/2021
  const data30AnosTotal = addYears(r.dataIngressoVirtualTotal, 30);
  
  // Usamos differenceInYears para obter exatamente os anos completos que ele TEM em 31/12/2021
  const anosCompletosRef = differenceInYears(DATA_REFERENCIA, r.dataIngressoVirtualTotal);
  
  const anosFaltantes = 30 - anosCompletosRef;
  
  const dataBase = DATA_REFERENCIA;
  let dataFinal = dataBase;
  let mesesAcrescimo = 0;

  if (anosFaltantes > 0) {
    mesesAcrescimo = Math.min(anosFaltantes * 4, 60);
    dataFinal = addMonths(dataBase, mesesAcrescimo);
    logAudit(r, `Regra da Tabela: Usado differenceInYears(31/12/2021, IngressoVirtualTotal) para anos civis exatos. Tinha ${anosCompletosRef} anos completos em 31/12/2021. Faltavam ${anosFaltantes} anos para 30. Pedágio: ${mesesAcrescimo} meses adicionados usando addMonths() a partir de 31/12/2021.`);
  } else {
    logAudit(r, `Regra da Tabela: Já possuía 30 anos totais completos em 31/12/2021. Pedágio = 0.`);
  }

  r.auditoria.regraTabela = {
    aplicavel: true,
    data25Efetivo: data25Efetivo.toISOString().split('T')[0],
    data30AnosTotal: data30AnosTotal.toISOString().split('T')[0],
    anosCompletosRef,
    anosFaltantes,
    mesesPedagio: mesesAcrescimo,
    dataBase: dataBase.toISOString().split('T')[0],
    dataFinal: dataFinal.toISOString().split('T')[0]
  };

  return dataFinal;
}

// ─── DATA REQUERIDA ───────────────────────────────────────────────────────────
function calcularDataRequerida(r: DadosReserva): Date {
  const hoje = today();

  if (r.dataIngresso >= DATA_REFORMA) {
    // ── PÓS-REFORMA (ingresso >= 01/01/2022) ──
    const data35Total = addYears(r.dataIngressoVirtualTotal, 35);
    const data30Efetivo = addYears(r.dataIngressoVirtualEfetivo, 30);
    
    const dataMaior = data35Total > data30Efetivo ? data35Total : data30Efetivo;

    logAudit(r, `Requerida Pós-Reforma: Usado addYears() para datas cravadas no calendário real.`);
    
    r.auditoria.escolhaRequerida = {
      regra: 'Pós-Reforma',
      data35Total: data35Total.toISOString().split('T')[0],
      data30Efetivo: data30Efetivo.toISOString().split('T')[0],
      prevaleceu: dataMaior.toISOString().split('T')[0],
      motivo: data35Total > data30Efetivo ? 'Data dos 35 anos totais é mais futura' : 'Data dos 30 anos efetivos é mais futura'
    };

    return dataMaior;
  }

  // ── PRÉ-REFORMA (ingresso < 01/01/2022) ──
  const dataPedagio17 = calcularPedagio17(r);
  const dataPedagioTabela = calcularPedagioTabela(r);

  const datasValidas: Date[] = [];
  if (dataPedagio17.getFullYear() < 9999) datasValidas.push(dataPedagio17);
  if (dataPedagioTabela.getFullYear() < 9999) datasValidas.push(dataPedagioTabela);

  if (!datasValidas.length) throw new Error('Nenhuma data requerida válida.');

  const dataFinal = new Date(Math.max(...datasValidas.map((d) => d.getTime())));

  let motivo = 'Apenas uma regra válida';
  if (datasValidas.length > 1) {
    if (dataFinal.getTime() === dataPedagio17.getTime()) {
      motivo = 'Pedágio 17% resultou na data mais futura';
    } else {
      motivo = 'Tabela Anexo Único resultou na data mais futura';
    }
  }

  r.auditoria.escolhaRequerida = {
    regra: 'Pré-Reforma',
    datasComparadas: datasValidas.map(d => d.toISOString().split('T')[0]),
    prevaleceu: dataFinal.toISOString().split('T')[0],
    motivo
  };

  return dataFinal;
}

// ─── DATA COMPULSÓRIA (Art. 90) ───────────────────────────────────────────────
function calcularDataCompulsoria(r: DadosReserva, dataRequerida: Date): Date {
  const patente = r.postoGrad.trim().toUpperCase();
  const posReforma = r.dataIngresso >= DATA_REFORMA;

  const idadeLimite = r.classe === 'O' ? 67 : 65;
  const dataIdade = addYears(r.dataNascimento, idadeLimite);

  const especiais3ou2 = ['CEL', 'CEL PROMO. REQ.', 'MAJ QOA', 'SUBTEN', 'SUBTEN PROMO. REQ.'];
  const especiais5ou4 = ['TEN CEL', 'TEN CEL PROMO. REQ.', 'CAP QOA'];

  let anosPosto = 0;
  let regraAplicada = 'Apenas Idade';

  if (especiais3ou2.includes(patente)) {
    anosPosto = posReforma ? 3 : 2;
    regraAplicada = `Posto Especial (${anosPosto} anos)`;
  } else if (especiais5ou4.includes(patente)) {
    anosPosto = posReforma ? 5 : 4;
    regraAplicada = `Posto Especial (${anosPosto} anos)`;
  }

  if (anosPosto === 0) {
    r.auditoria.compulsoria = {
      regraAplicada,
      limiteIdade: dataIdade.toISOString().split('T')[0],
      resultadoFinal: dataIdade.toISOString().split('T')[0]
    };
    logAudit(r, `Compulsória: Usada regra de apenas idade limite (${idadeLimite} anos), sem cálculo de posto.`);
    return dataIdade;
  }

  const dataPosto = addYears(r.dataUltimaPromocao, anosPosto);
  const dataCompulsoriaBruta = dataPosto < dataIdade ? dataPosto : dataIdade;
  const dataCompulsoriaFinal = dataCompulsoriaBruta > dataRequerida ? dataCompulsoriaBruta : dataRequerida;
  const tetoFinal = dataCompulsoriaFinal < dataIdade ? dataCompulsoriaFinal : dataIdade;

  r.auditoria.compulsoria = {
    regraAplicada,
    limitePosto: dataPosto.toISOString().split('T')[0],
    limiteIdade: dataIdade.toISOString().split('T')[0],
    requeridaBase: dataRequerida.toISOString().split('T')[0],
    datasIntermediarias: {
      brutaMinPostoIdade: dataCompulsoriaBruta.toISOString().split('T')[0],
      maxBrutaRequerida: dataCompulsoriaFinal.toISOString().split('T')[0]
    },
    resultadoFinal: tetoFinal.toISOString().split('T')[0]
  };
  
  logAudit(r, `Compulsória: Calculada via addYears() usando anos no posto e idade real no calendário.`);

  return tetoFinal;
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
    auditoria?: AuditoriaReserva;
    aviso?: string;
  } {
    if (!militar.dataIngresso) return { ok: false, aviso: 'Data de ingresso não informada' };
    if (!militar.dataNascimento) return { ok: false, aviso: 'Data de nascimento não informada' };
    if (!militar.sexo) return { ok: false, aviso: 'Sexo não informado' };
    if (!militar.dataUltimaPromocao) return { ok: false, aviso: 'Data da última promoção não informada' };

    const sumDias = (arr: any[], tipo: string) => arr.filter(a => a.tipo === tipo).reduce((s, a) => s + a.dias, 0);

    const PMPE = sumDias(averbacoes, 'PMPE');
    const FFAA = sumDias(averbacoes, 'FFAA');
    const INSS = sumDias(averbacoes, 'INSS');
    const BM_outros_estados = sumDias(averbacoes, 'BM DE OUTROS ESTADOS');
    const PM_outros_estados = sumDias(averbacoes, 'PM DE OUTROS ESTADOS');
    const ferias_n_gozadas = sumDias(afastamentos, 'FÉRIAS NÃO GOZADAS');
    const LTIP = sumDias(afastamentos, 'LTIP');

    const postoGradNorm = militar.postoGrad.trim().toUpperCase();
    
    // Efetivo serviço depende exclusivamente de: CBMPE(já embutido na data), PMPE, férias não gozadas, e subtrai LTIP
    const diasAverbacaoEfetivo = PMPE + ferias_n_gozadas - LTIP;
    
    // Tempo total: soma as demais averbações (FFAA, INSS, BM, PM). LTIP NÃO é deduzido do total, conta como tempo total.
    const diasAverbacaoTotal = PMPE + ferias_n_gozadas + FFAA + BM_outros_estados + PM_outros_estados + INSS;

    const dataIngresso = new Date(militar.dataIngresso);
    
    const auditoria: AuditoriaReserva = {
      dadosBase: {
        ingresso: dataIngresso.toISOString().split('T')[0],
        nascimento: new Date(militar.dataNascimento).toISOString().split('T')[0],
        promocao: new Date(militar.dataUltimaPromocao).toISOString().split('T')[0],
        sexo: militar.sexo,
        posto: postoGradNorm,
        pcnh: !!militar.pcnh,
        averbacoes_dias_efetivo: diasAverbacaoEfetivo,
        averbacoes_dias_total: diasAverbacaoTotal
      },
      temposCalculados: {},
      precisaoTemporal: []
    };

    const dataIngressoVirtualTotal = addDays(dataIngresso, -diasAverbacaoTotal);
    const dataIngressoVirtualEfetivo = addDays(dataIngresso, -diasAverbacaoEfetivo);

    auditoria.temposCalculados = {
      dataIngressoVirtualTotal: dataIngressoVirtualTotal.toISOString().split('T')[0],
      dataIngressoVirtualEfetivo: dataIngressoVirtualEfetivo.toISOString().split('T')[0],
      formulaVirtual: "addDays(ingresso, -totalDiasAverbados)"
    };

    const r: DadosReserva = {
      dataIngresso,
      dataNascimento: new Date(militar.dataNascimento),
      dataUltimaPromocao: new Date(militar.dataUltimaPromocao),
      sexo: militar.sexo,
      postoGrad: postoGradNorm,
      pcnh: militar.pcnh,
      PMPE, FFAA, INSS, BM_outros_estados, PM_outros_estados, ferias_n_gozadas, LTIP,
      classe: PATENTES_OFICIAIS.has(postoGradNorm) ? 'O' : 'P',
      diasAverbacaoTotal,
      diasAverbacaoEfetivo,
      dataIngressoVirtualTotal,
      dataIngressoVirtualEfetivo,
      auditoria
    };

    try {
      const requerida = calcularDataRequerida(r);
      let compulsoria = calcularDataCompulsoria(r, requerida);

      if (militar.pcnh) {
        const compulsoriaAnterior = compulsoria;
        // Regra PCNH: exatamente 2 meses após última promoção, sem aproximação
        compulsoria = addMonths(r.dataUltimaPromocao, 2);
        
        auditoria.pcnh = {
          aplicado: true,
          compulsoriaAnterior: compulsoriaAnterior.toISOString().split('T')[0],
          promocao: r.dataUltimaPromocao.toISOString().split('T')[0],
          novaCompulsoria: compulsoria.toISOString().split('T')[0],
          regra: "addMonths(promocao, 2)"
        };
        logAudit(r, `PCNH Aplicado: Substituiu compulsória anterior usando addMonths(promocao, 2), garantindo meses civis reais no calendário.`);
      }

      const reservaRequerimento = requerida.getTime() > compulsoria.getTime() ? compulsoria : requerida;

      return {
        ok: true,
        reservaRequerimento,
        reservaCompulsoria: compulsoria,
        auditoria: r.auditoria
      };
    } catch (err) {
      return { ok: false, aviso: err.message };
    }
  }
}
