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

function logAudit(r: DadosReserva, msg: string) {
    r.auditoria.precisaoTemporal.push(msg);
}

function calcularPedagio17(r: DadosReserva): Date {
    const tempoNecessario =
        (r.sexo === 'F' ? 25 : 30) * DIAS_ANO;

    const tempoAteReferencia =
        r.PMPE +
        r.FFAA +
        r.INSS +
        r.BM_outros_estados +
        r.PM_outros_estados +
        differenceInDays(DATA_REFERENCIA, r.dataIngresso) +
        r.ferias_n_gozadas -
        r.LTIP;

    const diasFaltantes =
        tempoNecessario - tempoAteReferencia;

    const diasPedagio =
        diasFaltantes > 0
            ? Math.floor(diasFaltantes * 1.17)
            : diasFaltantes;

    const dataFinal = addDays(
        DATA_REFERENCIA,
        diasPedagio,
    );

    r.auditoria.regra17 = {
        modelo: 'LEGADO',
        diasFaltantes,
        diasPedagio,
        dataFinal: dataFinal.toISOString().split('T')[0],
    };

    logAudit(
        r,
        `LEGADO 17%: ${diasFaltantes} dias faltantes × 1.17 = ${diasPedagio} dias. Resultado contado a partir de 31/12/2021 usando ano administrativo de 365 dias.`
    );

    return dataFinal;
}

function calcularPedagioTabela(r: DadosReserva): Date {
    if (r.sexo === 'F') {
        return new Date(9999, 11, 31);
    }

    const tempoEfetivoRef =
        differenceInDays(DATA_REFERENCIA, r.dataIngresso) +
        r.PMPE +
        r.ferias_n_gozadas -
        r.LTIP;

    const possui25Efetivo =
        tempoEfetivoRef >= 25 * DIAS_ANO;

    if (!possui25Efetivo) {
        r.auditoria.regraTabela = {
            aplicavel: false,
            motivo: 'Não possuía 25 anos efetivos em 31/12/2021.',
        };

        return new Date(9999, 11, 31);
    }

    const tempoTotalRef =
        differenceInDays(DATA_REFERENCIA, r.dataIngresso) +
        r.PMPE +
        r.FFAA +
        r.INSS +
        r.BM_outros_estados +
        r.PM_outros_estados +
        r.ferias_n_gozadas;

    const anosCompletos =
        Math.floor(tempoTotalRef / DIAS_ANO);

    const anosFaltantes =
        30 - anosCompletos;

    const mesesPedagio =
        Math.min(anosFaltantes * 4, 60);

    const data25Efetivo = addDays(
        r.dataIngresso,
        (25 * DIAS_ANO)
        - (r.PMPE + r.ferias_n_gozadas - r.LTIP),
    );

    const dataFinal = addMonths(
        data25Efetivo,
        mesesPedagio,
    );

    r.auditoria.regraTabela = {
        modelo: 'LEGADO_CORRIGIDO',
        anosCompletos,
        anosFaltantes,
        mesesPedagio,
        data25Efetivo: data25Efetivo.toISOString().split('T')[0],
        dataFinal: dataFinal.toISOString().split('T')[0],
    };

    logAudit(
        r,
        `LEGADO TABELA: ${anosFaltantes} anos faltantes × 4 meses = ${mesesPedagio} meses. Iniciado da data dos 25 anos efetivos.`
    );

    return dataFinal;
}

function calcularDataRequerida(r: DadosReserva): Date {
    const hoje = today();

    if (r.dataIngresso >= DATA_REFORMA) {
        const diasNecessariosTotal = 35 * DIAS_ANO;
        const diasNecessariosEfetivo = 30 * DIAS_ANO;

        const tempoEfetivoAtual =
            differenceInDays(hoje, r.dataIngresso) +
            r.PMPE +
            r.ferias_n_gozadas -
            r.LTIP;

        const tempoTotalAtual =
            tempoEfetivoAtual +
            r.FFAA +
            r.BM_outros_estados +
            r.PM_outros_estados +
            r.INSS;

        const diasFaltantesTotal =
            diasNecessariosTotal - tempoTotalAtual;

        const diasFaltantesEfetivo =
            diasNecessariosEfetivo - tempoEfetivoAtual;

        const data35Total = addDays(
            hoje,
            Math.max(diasFaltantesTotal, 0),
        );

        const data30Efetivo = addDays(
            hoje,
            Math.max(diasFaltantesEfetivo, 0),
        );

        const dataFinal =
            data35Total > data30Efetivo
                ? data35Total
                : data30Efetivo;

        r.auditoria.escolhaRequerida = {
            regra: 'Pos-Reforma-Legado',
            data35Total: data35Total.toISOString().split('T')[0],
            data30Efetivo: data30Efetivo.toISOString().split('T')[0],
            prevaleceu: dataFinal.toISOString().split('T')[0],
        };

        return dataFinal;
    }

    const dataPedagio17 = calcularPedagio17(r);
    const dataPedagioTabela = calcularPedagioTabela(r);

    const datasValidas: Date[] = [];

    if (dataPedagio17.getFullYear() < 9999) {
        datasValidas.push(dataPedagio17);
    }

    if (dataPedagioTabela.getFullYear() < 9999) {
        datasValidas.push(dataPedagioTabela);
    }

    const dataFinal = new Date(
        Math.max(...datasValidas.map((d) => d.getTime())),
    );

    r.auditoria.escolhaRequerida = {
        regra: 'Pre-Reforma-Legado',
        datasComparadas: datasValidas.map(
            d => d.toISOString().split('T')[0],
        ),
        prevaleceu: dataFinal.toISOString().split('T')[0],
    };

    return dataFinal;
}

function calcularDataCompulsoria(
    r: DadosReserva,
    dataRequerida: Date,
): Date {
    const patente = r.postoGrad.trim().toUpperCase();
    const posReforma = r.dataIngresso >= DATA_REFORMA;

    const idadeLimite = r.classe === 'O' ? 67 : 65;
    const dataIdade = addYears(r.dataNascimento, idadeLimite);

    const especiais3ou2 = [
        'CEL',
        'CEL PROMO. REQ.',
        'MAJ QOA',
        'SUBTEN',
        'SUBTEN PROMO. REQ.',
    ];

    const especiais5ou4 = [
        'TEN CEL',
        'TEN CEL PROMO. REQ.',
        'CAP QOA',
    ];

    let anosPosto = 0;

    if (especiais3ou2.includes(patente)) {
        anosPosto = posReforma ? 3 : 2;
    } else if (especiais5ou4.includes(patente)) {
        anosPosto = posReforma ? 5 : 4;
    }

    if (anosPosto === 0) {
        return dataIdade;
    }

    const dataPosto = addYears(
        r.dataUltimaPromocao,
        anosPosto,
    );

    const dataCompulsoriaBruta =
        dataPosto < dataIdade
            ? dataPosto
            : dataIdade;

    const dataCompulsoriaFinal =
        dataCompulsoriaBruta > dataRequerida
            ? dataCompulsoriaBruta
            : dataRequerida;

    return dataCompulsoriaFinal < dataIdade
        ? dataCompulsoriaFinal
        : dataIdade;
}

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
            arr
                .filter(a => a.tipo === tipo)
                .reduce((s, a) => s + a.dias, 0);

        const PMPE = sumDias(averbacoes, 'PMPE');
        const FFAA = sumDias(averbacoes, 'FFAA');
        const INSS = sumDias(averbacoes, 'INSS');
        const BM_outros_estados = sumDias(averbacoes, 'BM DE OUTROS ESTADOS');
        const PM_outros_estados = sumDias(averbacoes, 'PM DE OUTROS ESTADOS');
        const ferias_n_gozadas = sumDias(afastamentos, 'FÉRIAS NÃO GOZADAS');
        const LTIP = sumDias(afastamentos, 'LTIP');

        const diasAverbacaoEfetivo =
            PMPE + ferias_n_gozadas - LTIP;

        const diasAverbacaoTotal =
            PMPE +
            ferias_n_gozadas +
            FFAA +
            BM_outros_estados +
            PM_outros_estados +
            INSS;

        const dataIngresso = new Date(militar.dataIngresso);

        const auditoria: AuditoriaReserva = {
            dadosBase: {
                ingresso: dataIngresso.toISOString().split('T')[0],
                nascimento: new Date(militar.dataNascimento).toISOString().split('T')[0],
                promocao: new Date(militar.dataUltimaPromocao).toISOString().split('T')[0],
                sexo: militar.sexo,
                posto: militar.postoGrad,
                pcnh: !!militar.pcnh,
            },
            temposCalculados: {},
            precisaoTemporal: [],
        };

        const dataIngressoVirtualTotal = addDays(
            dataIngresso,
            -diasAverbacaoTotal,
        );

        const dataIngressoVirtualEfetivo = addDays(
            dataIngresso,
            -diasAverbacaoEfetivo,
        );

        const r: DadosReserva = {
            dataIngresso,
            dataNascimento: new Date(militar.dataNascimento),
            dataUltimaPromocao: new Date(militar.dataUltimaPromocao),
            sexo: militar.sexo,
            postoGrad: militar.postoGrad,
            pcnh: militar.pcnh,
            PMPE,
            FFAA,
            INSS,
            BM_outros_estados,
            PM_outros_estados,
            ferias_n_gozadas,
            LTIP,
            classe: PATENTES_OFICIAIS.has(militar.postoGrad.trim().toUpperCase()) ? 'O' : 'P',
            diasAverbacaoTotal,
            diasAverbacaoEfetivo,
            dataIngressoVirtualTotal,
            dataIngressoVirtualEfetivo,
            auditoria,
        };

        const requerida = calcularDataRequerida(r);

        let compulsoria = calcularDataCompulsoria(
            r,
            requerida,
        );

        if (militar.pcnh) {
            compulsoria = addMonths(
                r.dataUltimaPromocao,
                2,
            );
        }

        const reservaRequerimento =
            requerida.getTime() > compulsoria.getTime()
                ? compulsoria
                : requerida;

        return {
            ok: true,
            reservaRequerimento,
            reservaCompulsoria: compulsoria,
            auditoria,
        };
    }
}

