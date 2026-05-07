import { Injectable } from '@nestjs/common';
import {
  DATA_REFERENCIA,
  DATA_REFORMA,
  DIAS_ANO,
  LIMITE_IDADE_OFICIAL_ANOS,
  LIMITE_IDADE_PRACA_ANOS,
  POSTOS_TEMPO_3_2,
  POSTOS_TEMPO_5_4,
} from './reserva.constants';
import { CalculoReservaInput } from './reserva.types';
import { addDays, maxDate, minDate } from './reserva.utils';

@Injectable()
export class ReservaService {
  calcularTempoContribuicaoEfetiva(input: CalculoReservaInput): number {
    const base = input.dataBaseCalculo ?? new Date();
    const diasCbmpe = Math.max(
      0,
      Math.floor((base.getTime() - input.dataIngresso.getTime()) / 86400000),
    );
    return (
      diasCbmpe +
      input.extras.pmpeDias +
      input.extras.feriasNaoGozadasDias -
      input.extras.ltipDias
    );
  }

  calcularTempoTotal(input: CalculoReservaInput, tempoEfetivoDias: number): number {
    return (
      tempoEfetivoDias +
      input.extras.ffaaDias +
      input.extras.bmOutrosEstadosDias +
      input.extras.pmOutrosEstadosDias +
      input.extras.inssDias +
      input.extras.ltipDias
    );
  }

  calcularPedagio17(input: CalculoReservaInput, baseMetaDias: number): Date {
    const diasAteRef = Math.max(
      0,
      Math.floor((DATA_REFERENCIA.getTime() - input.dataIngresso.getTime()) / 86400000),
    );
    const faltava = Math.max(0, baseMetaDias - diasAteRef);
    const pedagio = Math.ceil(faltava * 0.17);
    return addDays(DATA_REFERENCIA, faltava + pedagio);
  }

  calcularPedagioTabela(input: CalculoReservaInput, metaEfetivoDias: number): Date {
    if (input.sexo === 'F') {
      return new Date(0);
    }
    const efetivoRef = Math.max(
      0,
      Math.floor((DATA_REFERENCIA.getTime() - input.dataIngresso.getTime()) / 86400000),
    );
    if (efetivoRef < 25 * DIAS_ANO) {
      return new Date(0);
    }
    const faltavaAnos = Math.max(0, Math.ceil((metaEfetivoDias - efetivoRef) / DIAS_ANO));
    const mesesPedagio = Math.min(60, faltavaAnos * 4);
    return addDays(DATA_REFERENCIA, faltavaAnos * DIAS_ANO + Math.floor(mesesPedagio * 30));
  }

  calcularDataRequerida(input: CalculoReservaInput): Date {
    if (input.dataIngresso >= DATA_REFORMA) {
      const data35Total = addDays(input.dataIngresso, 35 * DIAS_ANO - input.extras.inssDias);
      const data30Efetivo = addDays(input.dataIngresso, 30 * DIAS_ANO);
      return maxDate(data35Total, data30Efetivo);
    }

    const meta = input.sexo === 'F' ? 25 * DIAS_ANO : 30 * DIAS_ANO;
    const pedagio17 = this.calcularPedagio17(input, meta);
    const pedagioTabela = this.calcularPedagioTabela(input, meta);
    if (pedagioTabela.getTime() === 0) {
      return pedagio17;
    }
    return maxDate(pedagio17, pedagioTabela);
  }

  private calcularDataTempoNoPosto(input: CalculoReservaInput): Date {
    const preReforma = input.dataIngresso < DATA_REFORMA;
    let anos = preReforma ? 2 : 3;
    if (POSTOS_TEMPO_5_4.has(input.postoGrad)) {
      anos = preReforma ? 4 : 5;
    } else if (POSTOS_TEMPO_3_2.has(input.postoGrad)) {
      anos = preReforma ? 2 : 3;
    }
    return addDays(input.dataUltimaPromocao, anos * DIAS_ANO);
  }

  calcularDataCompulsoria(input: CalculoReservaInput): Date {
    const dataTempoPosto = this.calcularDataTempoNoPosto(input);
    const data30Efetivo = addDays(input.dataIngresso, 30 * DIAS_ANO);
    const data35Total = addDays(input.dataIngresso, 35 * DIAS_ANO);
    const requerida = this.calcularDataRequerida(input);
    const posReforma = input.dataIngresso >= DATA_REFORMA;

    const dataBase = posReforma
      ? maxDate(dataTempoPosto, data30Efetivo, data35Total)
      : requerida < DATA_REFORMA
        ? dataTempoPosto
        : maxDate(dataTempoPosto, data30Efetivo);

    const limiteAnos = input.classe === 'O' ? LIMITE_IDADE_OFICIAL_ANOS : LIMITE_IDADE_PRACA_ANOS;
    const idadeLimite = addDays(input.dataNascimento, limiteAnos * DIAS_ANO);
    return minDate(dataBase, idadeLimite);
  }

  calcular(input: CalculoReservaInput) {
    const tempoEfetivoDias = this.calcularTempoContribuicaoEfetiva(input);
    const tempoTotalDias = this.calcularTempoTotal(input, tempoEfetivoDias);
    const requerida = this.calcularDataRequerida(input);
    const compulsoria = this.calcularDataCompulsoria(input);
    return {
      tempoEfetivoDias,
      tempoTotalDias,
      reservaCompulsoria: compulsoria,
      reservaRequerimento: requerida > compulsoria ? compulsoria : requerida,
    };
  }
}
