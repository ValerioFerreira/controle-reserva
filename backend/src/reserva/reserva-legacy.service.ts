import { Injectable } from '@nestjs/common';
import {
    differenceInDays,
    addMonths,
    addYears,
    addDays,
} from 'date-fns';

const DATA_REFORMA = new Date(2022, 0, 1);
const DATA_REFERENCIA = new Date(2021, 11, 31);
const DIAS_ANO = 365;

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

function fmt(d: Date): string {
    return d.toISOString().split('T')[0];
}

function logAudit(r: DadosReserva, msg: string) {
    r.auditoria.precisaoTemporal.push(msg);
}

// ─── Pedágio 17% ANTIGO ───────────────────────────────────────────────────────
function calcularPedagio17(r: DadosReserva): Date {
    const anosNecessarios = r.sexo === 'F' ? 25 : 30;
    // Ano administrativo fixo: NÃO usa calendário real, NÃO considera leap years
    const tempoNecessario = anosNecessarios * DIAS_ANO;

    const diasCBMPE = differenceInDays(DATA_REFERENCIA, r.dataIngresso);

    const tempoAteReferencia =
        diasCBMPE +
        r.PMPE +
        r.FFAA +
        r.INSS +
        r.BM_outros_estados +
        r.PM_outros_estados +
        r.ferias_n_gozadas -
        r.LTIP;

    const diasFaltantes = tempoNecessario - tempoAteReferencia;

    const pedagioBruto = diasFaltantes > 0 ? diasFaltantes * 1.17 : 0;
    const diasPedagio  = diasFaltantes > 0 ? Math.floor(pedagioBruto) : 0;

    // Data base é sempre 31/12/2021 nas regras antigas
    const dataBase = DATA_REFERENCIA;
    const dataFinal = addDays(dataBase, diasPedagio);

    r.auditoria.regra17 = {
        modelo: 'ANTIGO',
        // Contexto do cálculo
        anosNecessarios,
        tempoNecessarioAdm: `${anosNecessarios} × 365 = ${tempoNecessario} dias`,
        diasCBMPEateRef: diasCBMPE,
        diasPMPE: r.PMPE,
        diasFFAA: r.FFAA,
        diasINSS: r.INSS,
        diasBM: r.BM_outros_estados,
        diasPM: r.PM_outros_estados,
        diasFeriasNaoGozadas: r.ferias_n_gozadas,
        diasLTIP: `-${r.LTIP}`,
        tempoAteReferencia,
        diasFaltantes,
        // Cálculo do pedágio
        formulaPedagio: diasFaltantes > 0
            ? `${diasFaltantes} × 1,17 = ${pedagioBruto.toFixed(2)}`
            : 'Requisito já cumprido (faltantes ≤ 0)',
        arredondamento: diasFaltantes > 0 ? `Math.floor(${pedagioBruto.toFixed(2)}) = ${diasPedagio}` : '—',
        diasPedagio,
        dataBase: fmt(dataBase),
        dataFinal: fmt(dataFinal),
        observacao: 'NÃO usa calendário real. NÃO considera anos bissextos. Usa 365 dias fixos por ano.',
    };

    logAudit(r,
        `ANTIGO 17%: Tempo necessário: ${anosNecessarios}×365 = ${tempoNecessario} dias (sem anos bissextos). ` +
        `Tempo até 31/12/2021: ${tempoAteReferencia} dias. ` +
        `Faltavam: ${diasFaltantes} dias. ` +
        (diasFaltantes > 0
            ? `Pedágio: ${diasFaltantes}×1,17 = ${pedagioBruto.toFixed(2)} → Math.floor → ${diasPedagio} dias. Data final: ${fmt(dataFinal)}.`
            : 'Requisito já cumprido.')
    );

    return dataFinal;
}

// ─── Pedágio Tabela ANTIGO — SEMPRE calcula ─────────────────────────────────────
function calcularPedagioTabela(r: DadosReserva): Date {
    if (r.sexo === 'F') {
        r.auditoria.regraTabela = { aplicavel: false, motivo: 'Regra exclusiva para homens (sexo M).' };
        return new Date(9999, 11, 31);
    }

    // Tempo efetivo até 31/12/2021 em dias administrativos
    const diasCBMPEateRef  = differenceInDays(DATA_REFERENCIA, r.dataIngresso);
    const tempoEfetivoRef  = diasCBMPEateRef + r.PMPE + r.ferias_n_gozadas - r.LTIP;
    const possui25Efetivo  = tempoEfetivoRef >= 25 * DIAS_ANO;

    // Data em que completaria 25 anos de efetivo serviço (via dias administrativos)
    const diasParaChegar25 = (25 * DIAS_ANO) - (r.PMPE + r.ferias_n_gozadas - r.LTIP);
    const data25Efetivo    = addDays(r.dataIngresso, diasParaChegar25);

    // Anos faltantes para 2022 = diferença do ano dos 25 efetivos até 2022
    const anosFaltantes = data25Efetivo.getFullYear() - 2022;

    // Tempo total até 31/12/2021
    const tempoTotalRef =
        diasCBMPEateRef +
        r.PMPE +
        r.FFAA +
        r.INSS +
        r.BM_outros_estados +
        r.PM_outros_estados +
        r.ferias_n_gozadas;
    const anosCompletos = Math.floor(tempoTotalRef / DIAS_ANO);

    // Pedágio: 4 meses por ano faltante, máximo 60 meses
    const mesesPedagio = Math.min(Math.max(anosFaltantes, 0) * 4, 60);

    // Pedágio inicia da data dos 25 anos efetivos
    const dataFinal = addMonths(data25Efetivo, mesesPedagio);

    r.auditoria.regraTabela = {
        modelo: 'ANTIGO_CORRIGIDO',
        aplicavel: r.sexo !== 'F',
        possui25EfetivoEm31122021: possui25Efetivo,
        // Dados do efetivo
        diasCBMPEateRef,
        diasPMPE: r.PMPE,
        diasFeriasNaoGozadas: r.ferias_n_gozadas,
        diasLTIP: `-${r.LTIP}`,
        tempoEfetivoRef,
        tempoEfetivoAdm: `${tempoEfetivoRef} dias ÷ 365 = ${(tempoEfetivoRef / DIAS_ANO).toFixed(2)} anos`,
        // Data dos 25 anos efetivos
        diasParaChegar25,
        data25Efetivo: fmt(data25Efetivo),
        // Anos faltantes
        anosFaltantes,
        formulaAnosFaltantes: `ano(${fmt(data25Efetivo)}) - 2022 = ${data25Efetivo.getFullYear()} - 2022 = ${anosFaltantes}`,
        // Tempo total para referência
        tempoTotalRef,
        anosCompletos,
        // Pedágio
        formulaPedagio: `max(${anosFaltantes}, 0) × 4 = ${Math.max(anosFaltantes, 0) * 4} meses (cap: 60)`,
        mesesPedagio,
        dataBase: fmt(data25Efetivo),
        dataFinal: fmt(dataFinal),
        observacao: 'Usa anos administrativos de 365 dias para calcular data dos 25 efetivos. NÃO considera leap years.',
    };

    logAudit(r,
        `ANTIGO TABELA: Efetivo até 31/12/2021: ${tempoEfetivoRef} dias (${(tempoEfetivoRef / DIAS_ANO).toFixed(2)} anos adm). ` +
        `Data dos 25 efetivos: ${fmt(data25Efetivo)}. ` +
        `Anos faltantes para 2022: ${anosFaltantes}. ` +
        `Pedágio: max(${anosFaltantes},0)×4 = ${mesesPedagio} meses. ` +
        `Data final: ${fmt(dataFinal)}.`
    );

    return dataFinal;
}

// ─── DATA REQUERIDA ───────────────────────────────────────────────────────────
function calcularDataRequerida(r: DadosReserva): Date {
    const hoje = today();

    if (r.dataIngresso >= DATA_REFORMA) {
        const diasNecessariosTotal   = 35 * DIAS_ANO;
        const diasNecessariosEfetivo = 30 * DIAS_ANO;

        const diasCBMPE = differenceInDays(hoje, r.dataIngresso);

        const tempoEfetivoAtual =
            diasCBMPE + r.PMPE + r.ferias_n_gozadas - r.LTIP;

        const tempoTotalAtual =
            tempoEfetivoAtual + r.FFAA + r.BM_outros_estados + r.PM_outros_estados + r.INSS;

        const diasFaltantesTotal   = diasNecessariosTotal   - tempoTotalAtual;
        const diasFaltantesEfetivo = diasNecessariosEfetivo - tempoEfetivoAtual;

        const data35Total  = addDays(hoje, Math.max(diasFaltantesTotal, 0));
        const data30Efetivo = addDays(hoje, Math.max(diasFaltantesEfetivo, 0));

        const dataFinal = data35Total > data30Efetivo ? data35Total : data30Efetivo;

        r.auditoria.escolhaRequerida = {
            regra: 'Pos-Reforma-Legado',
            observacao: 'Usa 35×365 e 30×365 — sem calendário real.',
            diasNecessariosTotal,
            diasNecessariosEfetivo,
            tempoTotalAtual,
            tempoEfetivoAtual,
            diasFaltantesTotal,
            diasFaltantesEfetivo,
            data35Total: fmt(data35Total),
            data30Efetivo: fmt(data30Efetivo),
            prevaleceu: fmt(dataFinal),
            motivo: data35Total > data30Efetivo
                ? 'Data dos 35 anos totais (administ.) é mais futura'
                : 'Data dos 30 anos efetivos (administ.) é mais futura',
        };

        logAudit(r,
            `ANTIGO Pós-Reforma: Tempo total atual: ${tempoTotalAtual} dias. Efetivo atual: ${tempoEfetivoAtual} dias. ` +
            `Faltam ${diasFaltantesTotal} dias para 35×365. Faltam ${diasFaltantesEfetivo} dias para 30×365.`
        );

        return dataFinal;
    }

    const dataPedagio17    = calcularPedagio17(r);
    const dataPedagioTabela = calcularPedagioTabela(r);

    const datasValidas: Date[] = [];
    if (dataPedagio17.getFullYear() < 9999)    datasValidas.push(dataPedagio17);
    if (dataPedagioTabela.getFullYear() < 9999) datasValidas.push(dataPedagioTabela);

    if (!datasValidas.length) {
        // Nunca deve acontecer, mas por segurança
        r.auditoria.escolhaRequerida = { regra: 'Pre-Reforma-Legado', datasComparadas: [], prevaleceu: '—', motivo: 'Nenhuma data válida encontrada.' };
        throw new Error('Nenhuma data requerida válida.');
    }

    const dataFinal = new Date(Math.max(...datasValidas.map(d => d.getTime())));

    let motivo = 'Apenas uma regra válida';
    if (datasValidas.length > 1) {
        motivo = dataFinal.getTime() === dataPedagio17.getTime()
            ? 'Pedágio 17% (legado) resultou na data mais futura'
            : 'Tabela Anexo Único (legado) resultou na data mais futura';
    }

    const diff = datasValidas.length === 2
        ? Math.abs(differenceInDays(datasValidas[0], datasValidas[1]))
        : null;

    r.auditoria.escolhaRequerida = {
        regra: 'Pre-Reforma-Legado',
        datasComparadas: datasValidas.map(d => fmt(d)),
        prevaleceu: fmt(dataFinal),
        motivo,
        ...(diff !== null ? { diferencaEntreDatas: `${diff} dias` } : {}),
    };

    logAudit(r, `ANTIGO Escolha Requerida: ${motivo}. Data final: ${fmt(dataFinal)}.`);

    return dataFinal;
}

// ─── COMPULSÓRIA ANTIGO ───────────────────────────────────────────────────────
function calcularDataCompulsoria(
    r: DadosReserva,
    dataRequerida: Date,
): Date {
    const patente   = r.postoGrad.trim().toUpperCase();
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
            limiteIdade: fmt(dataIdade),
            resultadoFinal: fmt(dataIdade),
            motivo: 'Posto sem grupo especial — compulsória = apenas idade limite.',
        };
        logAudit(r, `ANTIGO Compulsória: Posto sem grupo especial. ${r.classe === 'O' ? 'Oficial' : 'Praça'} → limite de ${idadeLimite} anos = ${fmt(dataIdade)}.`);
        return dataIdade;
    }

    const dataPosto          = addYears(r.dataUltimaPromocao, anosPosto);
    const dataCompulsoriaBruta = dataPosto < dataIdade ? dataPosto : dataIdade;
    const dataCompulsoriaFinal = dataCompulsoriaBruta > dataRequerida ? dataCompulsoriaBruta : dataRequerida;
    const tetoFinal            = dataCompulsoriaFinal < dataIdade ? dataCompulsoriaFinal : dataIdade;

    r.auditoria.compulsoria = {
        regraAplicada,
        idadeLimite: `${r.classe === 'O' ? 'Oficial' : 'Praça'}: ${idadeLimite} anos`,
        limiteIdade: fmt(dataIdade),
        anosPosto,
        limitePosto: fmt(dataPosto),
        requeridaBase: fmt(dataRequerida),
        datasIntermediarias: {
            brutaMinPostoIdade: fmt(dataCompulsoriaBruta),
            maxBrutaRequerida: fmt(dataCompulsoriaFinal),
        },
        resultadoFinal: fmt(tetoFinal),
        motivo:
            tetoFinal.getTime() === dataIdade.getTime()
                ? 'Limitada pelo teto de idade'
                : dataCompulsoriaFinal.getTime() === dataRequerida.getTime()
                    ? 'Bruta anterior à requerida — avançou para a requerida'
                    : 'Limitada pelo prazo do posto',
    };

    logAudit(r,
        `ANTIGO Compulsória: ${regraAplicada}. ` +
        `Posto: ${fmt(dataPosto)}. Idade: ${fmt(dataIdade)}. ` +
        `Bruta=min(posto,idade)=${fmt(dataCompulsoriaBruta)}. ` +
        `Ajuste=max(bruta,requerida)=${fmt(dataCompulsoriaFinal)}. ` +
        `Teto=min(ajuste,idade)=${fmt(tetoFinal)}.`
    );

    return tetoFinal;
}

// ─── FUNÇÃO PRINCIPAL ─────────────────────────────────────────────────────────
@Injectable()
export class ReservaLegacyService {
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
    ) {
        const sumDias = (arr: any[], tipo: string) =>
            arr.filter(a => a.tipo === tipo).reduce((s, a) => s + a.dias, 0);

        const PMPE             = sumDias(averbacoes, 'PMPE');
        const FFAA             = sumDias(averbacoes, 'FFAA');
        const INSS             = sumDias(averbacoes, 'INSS');
        const BM_outros_estados = sumDias(averbacoes, 'BM DE OUTROS ESTADOS');
        const PM_outros_estados = sumDias(averbacoes, 'PM DE OUTROS ESTADOS');
        const ferias_n_gozadas  = sumDias(afastamentos, 'FÉRIAS NÃO GOZADAS');
        const LTIP             = sumDias(afastamentos, 'LTIP');

        const diasAverbacaoEfetivo = PMPE + ferias_n_gozadas - LTIP;
        const diasAverbacaoTotal   =
            PMPE + ferias_n_gozadas + FFAA + BM_outros_estados + PM_outros_estados + INSS;

        const dataIngresso = new Date(militar.dataIngresso);
        const postoGradNorm = militar.postoGrad.trim().toUpperCase();

        const auditoria: AuditoriaReserva = {
            dadosBase: {
                ingresso:   fmt(dataIngresso),
                nascimento: fmt(new Date(militar.dataNascimento)),
                promocao:   fmt(new Date(militar.dataUltimaPromocao)),
                sexo:       militar.sexo,
                posto:      postoGradNorm,
                pcnh:       !!militar.pcnh,
                averbacoes_dias_efetivo: diasAverbacaoEfetivo,
                averbacoes_dias_total:   diasAverbacaoTotal,
            },
            temposCalculados: {},
            precisaoTemporal: [],
        };

        const dataIngressoVirtualTotal    = addDays(dataIngresso, -diasAverbacaoTotal);
        const dataIngressoVirtualEfetivo  = addDays(dataIngresso, -diasAverbacaoEfetivo);

        auditoria.temposCalculados = {
            modelo: 'ANTIGO',
            dataIngressoVirtualTotal:   fmt(dataIngressoVirtualTotal),
            dataIngressoVirtualEfetivo: fmt(dataIngressoVirtualEfetivo),
            formulaVirtual: 'addDays(ingresso, -totalDiasAverbados)',
            observacao: 'Datas virtuais para referência. Os cálculos de 17% e Tabela usam dias administrativos (365/ano), não essas datas.',
        };

        const r: DadosReserva = {
            dataIngresso,
            dataNascimento:     new Date(militar.dataNascimento),
            dataUltimaPromocao: new Date(militar.dataUltimaPromocao),
            sexo:       militar.sexo,
            postoGrad:  postoGradNorm,
            pcnh:       militar.pcnh,
            PMPE, FFAA, INSS, BM_outros_estados, PM_outros_estados, ferias_n_gozadas, LTIP,
            classe: PATENTES_OFICIAIS.has(postoGradNorm) ? 'O' : 'P',
            diasAverbacaoTotal,
            diasAverbacaoEfetivo,
            dataIngressoVirtualTotal,
            dataIngressoVirtualEfetivo,
            auditoria,
        };

        const requerida = calcularDataRequerida(r);
        let compulsoria = calcularDataCompulsoria(r, requerida);

        if (militar.pcnh) {
            const compulsoriaAnterior = compulsoria;
            compulsoria = addMonths(r.dataUltimaPromocao, 2);

            auditoria.pcnh = {
                aplicado: true,
                compulsoriaAnterior: fmt(compulsoriaAnterior),
                promocao:           fmt(r.dataUltimaPromocao),
                novaCompulsoria:    fmt(compulsoria),
                regra:              'addMonths(promocao, 2)',
                observacao:         'PCNH: mesmo comportamento nas regras antigas e novas.',
            };
            logAudit(r, `ANTIGO PCNH Aplicado: Nova compulsória = promoção + 2 meses = ${fmt(compulsoria)}.`);
        }

        const reservaRequerimento =
            requerida.getTime() > compulsoria.getTime() ? compulsoria : requerida;

        return {
            ok: true,
            reservaRequerimento,
            reservaCompulsoria: compulsoria,
            auditoria,
        };
    }
}
