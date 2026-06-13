import { Injectable } from '@nestjs/common';
import { differenceInDays, differenceInYears, addMonths, addYears, addDays } from 'date-fns';

const DATA_REFORMA   = new Date(2022, 0, 1);
const DATA_REFERENCIA = new Date(2021, 11, 31);

const PATENTES_OFICIAIS = new Set([
  'CEL', 'CEL PROMO. REQ.',
  'TEN CEL', 'TEN CEL PROMO. REQ.',
  'MAJ QOC', 'MAJ QOA', 'CAP QOA',
  '1ºTEN QOC', '1ºTEN QOA',
  '2ºTEN QOC', '2ºTEN QOA', '2ºTEN QOA PROMO. REQ.',
  'ASPIRANTE',
]);

export interface AuditoriaReserva {
  dadosBase: any; temposCalculados: any;
  regra17?: any; regraTabela?: any; escolhaRequerida?: any;
  compulsoria?: any; pcnh?: any; precisaoTemporal: string[];
}

interface DadosReserva {
  dataIngresso: Date; dataNascimento: Date; dataUltimaPromocao: Date;
  sexo: string; postoGrad: string; pcnh?: boolean;
  PMPE: number; FFAA: number; INSS: number;
  BM_outros_estados: number; PM_outros_estados: number;
  ferias_n_gozadas: number; LTIP: number;
  classe?: 'O' | 'P';
  diasAverbacaoTotal: number; diasAverbacaoEfetivo: number;
  dataIngressoVirtualTotal: Date; dataIngressoVirtualEfetivo: Date;
  auditoria: AuditoriaReserva;
}

function today(): Date { const d = new Date(); d.setHours(0,0,0,0); return d; }
function fmt(d: Date): string { return d.toISOString().split('T')[0]; }
function logAudit(r: DadosReserva, msg: string) { r.auditoria.precisaoTemporal.push(msg); }

// Conta anos bissextos entre duas datas
function contarLeapYears(inicio: Date, fim: Date): number[] {
  const anos: number[] = [];
  for (let y = inicio.getFullYear(); y <= fim.getFullYear(); y++) {
    if ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) anos.push(y);
  }
  return anos;
}

// ─── Pedágio 17% NOVO ─────────────────────────────────────────────────────────
function calcularPedagio17(r: DadosReserva): Date {
  const anosNecessarios = r.sexo === 'F' ? 25 : 30;

  // Ciclo civil real: data exata dos 30 anos sem averbações
  const data30AnosReal = addYears(r.dataIngresso, anosNecessarios);
  const diasTotais30Anos = differenceInDays(data30AnosReal, r.dataIngresso);

  // Leap years no ciclo civil real
  const leapYears = contarLeapYears(r.dataIngresso, data30AnosReal);
  const diasAdm = anosNecessarios * 365;
  const difLeap = diasTotais30Anos - diasAdm;

  // Averbações: quais entram no total
  const diasAverbTotal = r.diasAverbacaoTotal; // PMPE+férias-LTIP+FFAA+BM+PM+INSS

  // Dias necessários após abater averbações
  const diasNecessariosComAverbacao = diasTotais30Anos - diasAverbTotal;
  const dataAlvoSemPedagio = addDays(r.dataIngresso, diasNecessariosComAverbacao);

  const diasFaltantes = differenceInDays(dataAlvoSemPedagio, DATA_REFERENCIA);

  let diasPedagio = 0;
  let dataFinal   = dataAlvoSemPedagio;
  let pedagioBruto = 0;

  if (diasFaltantes > 0) {
    pedagioBruto = diasFaltantes * 0.17;
    diasPedagio  = Math.round(pedagioBruto);
    dataFinal    = addDays(dataAlvoSemPedagio, diasPedagio);
  }

  r.auditoria.regra17 = {
    modelo: 'NOVO',
    // Ciclo civil real
    anosNecessarios,
    data30AnosReal:        fmt(data30AnosReal),
    diasTotais30Anos,
    diasAdministrativos:   diasAdm,
    diferencaLeapYears:    difLeap,
    leapYearsNoCiclo:      leapYears,
    qtdLeapYears:          leapYears.length,
    // Averbações no cálculo do total
    averbacaoTotalDias:    diasAverbTotal,
    composicaoTotal:       `PMPE(${r.PMPE}) + férias(${r.ferias_n_gozadas}) - LTIP(${r.LTIP}) + FFAA(${r.FFAA}) + BM(${r.BM_outros_estados}) + PM(${r.PM_outros_estados}) + INSS(${r.INSS})`,
    naoEntramNoTotal:      'Nenhum: todas as averbações e afastamentos impactam o tempo total',
    diasNecessariosComAverbacao,
    dataAlvoSemPedagio:    fmt(dataAlvoSemPedagio),
    // Pedágio
    diasFaltantesRef:      diasFaltantes,
    formulaPedagio:        diasFaltantes > 0
      ? `${diasFaltantes} × 0,17 = ${pedagioBruto.toFixed(4)}`
      : 'Requisito já cumprido (faltantes ≤ 0)',
    arredondamento:        diasFaltantes > 0
      ? `Math.round(${pedagioBruto.toFixed(4)}) = ${diasPedagio} dias`
      : '—',
    motivoMathRound:       'Math.round (≥ 0.5 arredonda para cima) — favor ao militar vs Math.floor do modelo antigo',
    diasPedagio,
    dataBase:              fmt(DATA_REFERENCIA),
    dataFinal:             fmt(dataFinal),
    observacao:            'USA calendário civil real. Leap years contabilizados naturalmente no ciclo. Averbações NÃO criam leap years artificiais — são subtraídas em dias, não em anos.',
  };

  logAudit(r,
    `Regra 17% [NOVO]: Ciclo civil real de ${anosNecessarios} anos = ${diasTotais30Anos} dias ` +
    `(vs ${diasAdm} adm., diferença de ${difLeap} dias por ${leapYears.length} leap years: [${leapYears.join(',')}]). ` +
    `Averbações totais abatidas: ${diasAverbTotal} dias → data-alvo: ${fmt(dataAlvoSemPedagio)}. ` +
    (diasFaltantes > 0
      ? `Faltavam ${diasFaltantes} dias em 31/12/2021. Pedágio: ${diasFaltantes}×0,17=${pedagioBruto.toFixed(2)}→Math.round→${diasPedagio} dias. Data final: ${fmt(dataFinal)}.`
      : 'Requisito cumprido antes de 31/12/2021. Pedágio=0.')
  );

  return dataFinal;
}

// ─── Pedágio Tabela NOVO ──────────────────────────────────────────────────────
function calcularPedagioTabela(r: DadosReserva): Date {

  // Efetivo: PMPE + férias - LTIP (FFAA, INSS, BM, PM NÃO entram no efetivo)
  const diasEfetivosAverbados = r.PMPE + r.ferias_n_gozadas - r.LTIP;

  // Data dos 25 anos de efetivo via data virtual de ingresso (que embute as averbações efetivas)
  const data25Efetivo = addYears(r.dataIngressoVirtualEfetivo, 25);
  const diasTotais25Efetivo = differenceInDays(data25Efetivo, r.dataIngressoVirtualEfetivo);

  // Leap years no ciclo efetivo
  const leapYearsEfetivo = contarLeapYears(r.dataIngressoVirtualEfetivo, data25Efetivo);

  // Anos faltantes = ano(data25) - 2022
  const anosFaltantes = data25Efetivo.getFullYear() - 2022;
  const mesesAcrescimo = Math.min(Math.max(anosFaltantes, 0) * 4, 60);
  const dataFinal = addMonths(data25Efetivo, mesesAcrescimo);

  r.auditoria.regraTabela = {
    modelo: 'NOVO',
    aplicavel: true,
    // Composição do efetivo
    entramNoEfetivo:         `CBMPE (embutido na data) + PMPE(${r.PMPE}) + férias(${r.ferias_n_gozadas}) - LTIP(${r.LTIP})`,
    naoEntramNoEfetivo:      `FFAA(${r.FFAA}), INSS(${r.INSS}), BM(${r.BM_outros_estados}), PM(${r.PM_outros_estados}) — contam no total mas NÃO no efetivo`,
    motivoLTIP:              'LTIP reduz o efetivo porque são dias sem prestação de serviço ativo',
    motivoFeriasAdicionar:   'Férias não gozadas somam porque representam serviço ativo não usufruído',
    diasEfetivosAverbados,
    dataIngressoVirtualEfetivo: fmt(r.dataIngressoVirtualEfetivo),
    // Data dos 25 anos
    data25Efetivo:           fmt(data25Efetivo),
    diasTotais25Efetivo,
    leapYearsNoCicloEfetivo: leapYearsEfetivo,
    qtdLeapYearsEfetivo:     leapYearsEfetivo.length,
    // Pedágio
    anosFaltantes,
    formulaAnosFaltantes:    `ano(${fmt(data25Efetivo)}) - 2022 = ${data25Efetivo.getFullYear()} - 2022 = ${anosFaltantes}`,
    formulaPedagio:          `max(${anosFaltantes},0) × 4 = ${Math.max(anosFaltantes,0)*4} meses (cap: 60)`,
    mesesPedagio:            mesesAcrescimo,
    motivoAddMonths:         'addMonths() garante meses civis reais (28/29/30/31 dias), sem aproximação de 30 dias fixos',
    dataBase:                fmt(data25Efetivo),
    dataFinal:               fmt(dataFinal),
    observacao:              'USA calendário civil real para data dos 25 anos efetivos. Leap years contabilizados no ciclo efetivo. Diverge do legado porque o legado usa 25×365 dias fixos.',
  };

  logAudit(r,
    `Regra Tabela [NOVO]: Data dos 25 anos efetivos via addYears(ingressoVirtualEfetivo, 25) = ${fmt(data25Efetivo)} ` +
    `(ciclo de ${diasTotais25Efetivo} dias reais, ${leapYearsEfetivo.length} leap years: [${leapYearsEfetivo.join(',')}]). ` +
    `Entram no efetivo: PMPE(${r.PMPE})+férias(${r.ferias_n_gozadas})-LTIP(${r.LTIP}). ` +
    `NÃO entram: FFAA(${r.FFAA}), INSS(${r.INSS}), BM(${r.BM_outros_estados}), PM(${r.PM_outros_estados}). ` +
    `Anos faltantes p/ 2022: ${anosFaltantes}. Pedágio: max(${anosFaltantes},0)×4=${mesesAcrescimo} meses. Data final: ${fmt(dataFinal)}.`
  );

  return dataFinal;
}

// ─── DATA REQUERIDA NOVO ──────────────────────────────────────────────────────
function calcularDataRequerida(r: DadosReserva): Date {
  if (r.dataIngresso >= DATA_REFORMA) {
    const data35Total   = addYears(r.dataIngressoVirtualTotal, 35);
    const data30Efetivo = addYears(r.dataIngressoVirtualEfetivo, 30);
    const dataMaior     = data35Total > data30Efetivo ? data35Total : data30Efetivo;
    const diff          = Math.abs(differenceInDays(data35Total, data30Efetivo));

    r.auditoria.escolhaRequerida = {
      regra: 'Pós-Reforma',
      observacao: 'addYears() sobre datas virtuais — calendário civil real.',
      dataIngressoVirtualTotal:   fmt(r.dataIngressoVirtualTotal),
      dataIngressoVirtualEfetivo: fmt(r.dataIngressoVirtualEfetivo),
      data35Total:    fmt(data35Total),
      data30Efetivo:  fmt(data30Efetivo),
      prevaleceu:     fmt(dataMaior),
      motivo: data35Total > data30Efetivo
        ? 'Data dos 35 anos totais (calendário real) é mais futura'
        : 'Data dos 30 anos efetivos (calendário real) é mais futura',
      diferencaEntreDatas: `${diff} dias`,
    };

    logAudit(r, `Requerida Pós-Reforma [NOVO]: 35 anos total=${fmt(data35Total)} vs 30 anos efetivo=${fmt(data30Efetivo)}. Prevaleceu: ${fmt(dataMaior)} (diff ${diff} dias).`);
    return dataMaior;
  }

  const dataPedagio17     = calcularPedagio17(r);
  const dataPedagioTabela = calcularPedagioTabela(r);

  const datasValidas: Date[] = [];
  if (dataPedagio17.getFullYear()     < 9999) datasValidas.push(dataPedagio17);
  if (dataPedagioTabela.getFullYear() < 9999) datasValidas.push(dataPedagioTabela);

  if (!datasValidas.length) throw new Error('Nenhuma data requerida válida.');

  const dataFinal = new Date(Math.max(...datasValidas.map(d => d.getTime())));

  let motivo = 'Apenas uma regra válida';
  if (datasValidas.length > 1) {
    motivo = dataFinal.getTime() === dataPedagio17.getTime()
      ? 'Pedágio 17% resultou na data mais futura'
      : 'Tabela Anexo Único resultou na data mais futura';
  }

  const diff = datasValidas.length === 2
    ? Math.abs(differenceInDays(datasValidas[0], datasValidas[1]))
    : null;

  r.auditoria.escolhaRequerida = {
    regra: 'Pré-Reforma',
    datasComparadas:    datasValidas.map(d => fmt(d)),
    data17pct:          fmt(dataPedagio17),
    dataTabela:         fmt(dataPedagioTabela),
    prevaleceu:         fmt(dataFinal),
    motivo,
    ...(diff !== null ? { diferencaEntreDatas: `${diff} dias` } : {}),
    observacao:         'Prevalece a maior das duas datas (mais restritiva para o militar).',
  };

  logAudit(r, `Requerida Pré-Reforma [NOVO]: 17%=${fmt(dataPedagio17)}, Tabela=${fmt(dataPedagioTabela)}. ${motivo}. Resultado: ${fmt(dataFinal)}.`);
  return dataFinal;
}

// ─── COMPULSÓRIA NOVO ─────────────────────────────────────────────────────────
function calcularDataCompulsoria(r: DadosReserva, dataRequerida: Date): Date {
  const patente    = r.postoGrad.trim().toUpperCase();
  const posReforma = r.dataIngresso >= DATA_REFORMA;

  const idadeLimite = r.classe === 'O' ? 67 : 65;
  const dataIdade   = addYears(r.dataNascimento, idadeLimite);

  const especiais3ou2 = ['CEL', 'CEL PROMO. REQ.', 'MAJ QOA', 'SUBTEN', 'SUBTEN PROMO. REQ.'];
  const especiais5ou4 = ['TEN CEL', 'TEN CEL PROMO. REQ.', 'CAP QOA'];

  let anosPosto    = 0;
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
      idadeLimite: `${r.classe === 'O' ? 'Oficial' : 'Praça'}: ${idadeLimite} anos`,
      limiteIdade:   fmt(dataIdade),
      resultadoFinal: fmt(dataIdade),
      motivo:        'Posto sem grupo especial — compulsória = apenas limite de idade.',
      observacao:    'addYears(dataNascimento, idadeLimite) — calendário civil real.',
    };
    logAudit(r, `Compulsória [NOVO]: Apenas idade. ${idadeLimite} anos = ${fmt(dataIdade)}.`);
    return dataIdade;
  }

  const dataPosto            = addYears(r.dataUltimaPromocao, anosPosto);
  const dataCompulsoriaBruta = dataPosto < dataIdade ? dataPosto : dataIdade;
  const dataCompulsoriaFinal = dataCompulsoriaBruta > dataRequerida ? dataCompulsoriaBruta : dataRequerida;
  const tetoFinal            = dataCompulsoriaFinal < dataIdade ? dataCompulsoriaFinal : dataIdade;

  const motivoFinal =
    tetoFinal.getTime() === dataIdade.getTime()
      ? 'Limitada pelo teto de idade'
      : dataCompulsoriaFinal.getTime() === dataRequerida.getTime()
        ? 'Bruta anterior à requerida — avançou para a requerida'
        : 'Limitada pelo prazo do posto';

  r.auditoria.compulsoria = {
    regraAplicada,
    idadeLimite:   `${r.classe === 'O' ? 'Oficial' : 'Praça'}: ${idadeLimite} anos`,
    limiteIdade:   fmt(dataIdade),
    anosPosto,
    limitePosto:   fmt(dataPosto),
    requeridaBase: fmt(dataRequerida),
    datasIntermediarias: {
      brutaMinPostoIdade: fmt(dataCompulsoriaBruta),
      maxBrutaRequerida:  fmt(dataCompulsoriaFinal),
    },
    resultadoFinal: fmt(tetoFinal),
    motivo:         motivoFinal,
    observacao:     'addYears() — calendário civil real para posto e idade.',
  };

  logAudit(r,
    `Compulsória [NOVO]: ${regraAplicada}. Posto: ${fmt(dataPosto)}. Idade: ${fmt(dataIdade)}. ` +
    `Bruta=min(posto,idade)=${fmt(dataCompulsoriaBruta)}. ` +
    `Ajuste=max(bruta,requerida)=${fmt(dataCompulsoriaFinal)}. ` +
    `Teto=min(ajuste,idade)=${fmt(tetoFinal)}. Motivo: ${motivoFinal}.`
  );

  return tetoFinal;
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────
@Injectable()
export class ReservaService {
  calcularDatasReserva(
    militar: {
      dataIngresso: Date; dataNascimento: Date; dataUltimaPromocao: Date;
      sexo: string; postoGrad: string; pcnh?: boolean;
    },
    averbacoes: Array<{ tipo: string; dias: number }>,
    afastamentos: Array<{ tipo: string; dias: number }>,
  ): {
    ok: boolean; reservaRequerimento?: Date; reservaCompulsoria?: Date;
    auditoria?: AuditoriaReserva; aviso?: string;
  } {
    if (!militar.dataIngresso)     return { ok: false, aviso: 'Data de ingresso não informada' };
    if (!militar.dataNascimento)   return { ok: false, aviso: 'Data de nascimento não informada' };
    if (!militar.sexo)             return { ok: false, aviso: 'Sexo não informado' };
    if (!militar.dataUltimaPromocao) return { ok: false, aviso: 'Data da última promoção não informada' };

    const sumDias = (arr: any[], tipo: string) =>
      arr.filter(a => a.tipo === tipo).reduce((s, a) => s + a.dias, 0);

    const PMPE             = sumDias(averbacoes, 'PMPE');
    const FFAA             = sumDias(averbacoes, 'FFAA');
    const INSS             = sumDias(averbacoes, 'INSS');
    const BM_outros_estados = sumDias(averbacoes, 'BM DE OUTROS ESTADOS');
    const PM_outros_estados = sumDias(averbacoes, 'PM DE OUTROS ESTADOS');
    const ferias_n_gozadas  = sumDias(afastamentos, 'FÉRIAS NÃO GOZADAS');
    const LTIP             = sumDias(afastamentos, 'LTIP');

    const postoGradNorm = militar.postoGrad.trim().toUpperCase();

    const diasAverbacaoEfetivo = PMPE + ferias_n_gozadas - LTIP;
    const diasAverbacaoTotal   = PMPE + ferias_n_gozadas - LTIP + FFAA + BM_outros_estados + PM_outros_estados + INSS;

    const dataIngresso = new Date(militar.dataIngresso);

    const auditoria: AuditoriaReserva = {
      dadosBase: {
        modelo: 'NOVO',
        ingresso:   fmt(dataIngresso),
        nascimento: fmt(new Date(militar.dataNascimento)),
        promocao:   fmt(new Date(militar.dataUltimaPromocao)),
        sexo: militar.sexo, posto: postoGradNorm, pcnh: !!militar.pcnh,
        averbacoes: {
          PMPE, FFAA, INSS,
          BM_outros_estados, PM_outros_estados,
          ferias_n_gozadas, LTIP,
          diasEfetivo:  diasAverbacaoEfetivo,
          diasTotal:    diasAverbacaoTotal,
          composicaoEfetivo: `PMPE(${PMPE})+férias(${ferias_n_gozadas})-LTIP(${LTIP}) = ${diasAverbacaoEfetivo}`,
          composicaoTotal:   `efetivo(${diasAverbacaoEfetivo})+FFAA(${FFAA})+BM(${BM_outros_estados})+PM(${PM_outros_estados})+INSS(${INSS}) = ${diasAverbacaoTotal}`,
        },
      },
      temposCalculados: {},
      precisaoTemporal: [],
    };

    const dataIngressoVirtualTotal    = addDays(dataIngresso, -diasAverbacaoTotal);
    const dataIngressoVirtualEfetivo  = addDays(dataIngresso, -diasAverbacaoEfetivo);

    auditoria.temposCalculados = {
      modelo: 'NOVO',
      dataIngressoVirtualTotal:   fmt(dataIngressoVirtualTotal),
      dataIngressoVirtualEfetivo: fmt(dataIngressoVirtualEfetivo),
      formulaVirtual: 'addDays(ingresso, -totalDiasAverbados)',
      explicacao: 'Datas virtuais representam "se o militar tivesse iniciado mais cedo, como se o tempo averbado já tivesse sido cumprido".',
    };

    const r: DadosReserva = {
      dataIngresso,
      dataNascimento:     new Date(militar.dataNascimento),
      dataUltimaPromocao: new Date(militar.dataUltimaPromocao),
      sexo: militar.sexo, postoGrad: postoGradNorm, pcnh: militar.pcnh,
      PMPE, FFAA, INSS, BM_outros_estados, PM_outros_estados, ferias_n_gozadas, LTIP,
      classe: PATENTES_OFICIAIS.has(postoGradNorm) ? 'O' : 'P',
      diasAverbacaoTotal, diasAverbacaoEfetivo,
      dataIngressoVirtualTotal, dataIngressoVirtualEfetivo,
      auditoria,
    };

    try {
      const requerida  = calcularDataRequerida(r);
      let   compulsoria = calcularDataCompulsoria(r, requerida);

      if (militar.pcnh) {
        const compulsoriaAnterior = compulsoria;
        compulsoria = addMonths(r.dataUltimaPromocao, 2);
        auditoria.pcnh = {
          aplicado: true,
          compulsoriaAnterior: fmt(compulsoriaAnterior),
          promocao:            fmt(r.dataUltimaPromocao),
          novaCompulsoria:     fmt(compulsoria),
          regra:               'addMonths(promocao, 2)',
          observacao:          'PCNH: meses civis reais (date-fns). Sobrepõe a compulsória anterior independente do valor.',
        };
        logAudit(r, `PCNH [NOVO]: Compulsória anterior=${fmt(compulsoriaAnterior)} substituída por promoção+2meses=${fmt(compulsoria)}.`);
      }

      const reservaRequerimento = requerida.getTime() > compulsoria.getTime() ? compulsoria : requerida;

      return { ok: true, reservaRequerimento, reservaCompulsoria: compulsoria, auditoria: r.auditoria };
    } catch (err) {
      return { ok: false, aviso: err.message };
    }
  }
}
