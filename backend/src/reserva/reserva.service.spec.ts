import { ReservaService } from './reserva.service';
import { PostoGrad } from './reserva.types';

describe('ReservaService', () => {
  const service = new ReservaService();

  it('calcula tempo efetivo e total corretamente', () => {
    const result = service.calcular({
      postoGrad: PostoGrad.SUBTEN,
      classe: 'P',
      sexo: 'M',
      dataIngresso: new Date('2010-01-01T00:00:00.000Z'),
      dataUltimaPromocao: new Date('2020-01-01T00:00:00.000Z'),
      dataNascimento: new Date('1980-01-01T00:00:00.000Z'),
      dataBaseCalculo: new Date('2025-01-01T00:00:00.000Z'),
      extras: {
        inssDias: 100,
        ffaaDias: 50,
        pmpeDias: 20,
        pmOutrosEstadosDias: 10,
        bmOutrosEstadosDias: 5,
        feriasNaoGozadasDias: 15,
        ltipDias: 12,
      },
    });

    expect(result.tempoEfetivoDias).toBeGreaterThan(0);
    expect(result.tempoTotalDias).toBeGreaterThan(result.tempoEfetivoDias);
    expect(result.reservaRequerimento.getTime()).toBeLessThanOrEqual(
      result.reservaCompulsoria.getTime(),
    );
  });

  it('aplica regra pos-reforma', () => {
    const requerida = service.calcularDataRequerida({
      postoGrad: PostoGrad.CEL,
      classe: 'O',
      sexo: 'M',
      dataIngresso: new Date('2023-01-01T00:00:00.000Z'),
      dataUltimaPromocao: new Date('2024-01-01T00:00:00.000Z'),
      dataNascimento: new Date('1990-01-01T00:00:00.000Z'),
      extras: {
        inssDias: 0,
        ffaaDias: 0,
        pmpeDias: 0,
        pmOutrosEstadosDias: 0,
        bmOutrosEstadosDias: 0,
        feriasNaoGozadasDias: 0,
        ltipDias: 0,
      },
    });
    expect(requerida.getUTCFullYear()).toBeGreaterThanOrEqual(2052);
  });
});
