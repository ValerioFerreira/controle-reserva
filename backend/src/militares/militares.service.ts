import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';
import { definirClasse, normalizarPostoGrad } from '../reserva/reserva.utils';
import { TipoAfastamento as TipoAfastamentoReserva, TipoAverbacao as TipoAverbacaoReserva } from '../reserva/reserva.types';
import { ListMilitaresDto } from './dto/list-militares.dto';

@Injectable()
export class MilitaresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservaService: ReservaService,
  ) {}

  async getByMatricula(matricula: string) {
    const militar = await this.prisma.militar.findUnique({
      where: { matricula },
      include: { averbacoes: true, afastamentos: true },
    });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    return militar;
  }

  async list(query: ListMilitaresDto) {
    const where: Record<string, unknown> = {};
    if (query.matricula) where.matricula = { contains: query.matricula };
    if (query.nome) where.nome = { contains: query.nome, mode: 'insensitive' };
    if (query.postoGrad) where.postoGradNormalizado = query.postoGrad;
    if (query.dataInicio || query.dataFim) {
      where.reservaRequerimento = {
        gte: query.dataInicio ? new Date(query.dataInicio) : undefined,
        lte: query.dataFim ? new Date(query.dataFim) : undefined,
      };
    }
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.militar.findMany({
        where,
        orderBy: { ordemHierarquica: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.militar.count({ where }),
    ]);
    return { data, page, pageSize, total };
  }

  async dashboard() {
    const militares = await this.prisma.militar.findMany({
      select: { reservaRequerimento: true },
    });
    const now = new Date();
    let alertaVermelho = 0;
    let alertaAmarelo = 0;
    for (const m of militares) {
      if (!m.reservaRequerimento) continue;
      const diff = Math.ceil(
        (m.reservaRequerimento.getTime() - now.getTime()) / 86400000,
      );
      if (diff <= 30) alertaVermelho += 1;
      else if (diff <= 90) alertaAmarelo += 1;
    }
    return {
      totalMilitares: militares.length,
      alertaVermelho,
      alertaAmarelo,
    };
  }

  async recalculateByMatricula(matricula: string) {
    const militar = await this.getByMatricula(matricula);
    const sumDiasByTipo = (
      items: Array<{ tipo: string; dias: number }>,
      tipo: string,
    ): number => items
      .filter((item) => item.tipo === tipo)
      .reduce((sum, item) => sum + item.dias, 0);

    const extras = {
      inssDias: sumDiasByTipo(militar.averbacoes, TipoAverbacaoReserva.INSS),
      ffaaDias: sumDiasByTipo(militar.averbacoes, TipoAverbacaoReserva.FFAA),
      pmpeDias: sumDiasByTipo(militar.averbacoes, TipoAverbacaoReserva.PMPE),
      pmOutrosEstadosDias: sumDiasByTipo(militar.averbacoes, TipoAverbacaoReserva.PM_OUTROS_ESTADOS),
      bmOutrosEstadosDias: sumDiasByTipo(militar.averbacoes, TipoAverbacaoReserva.BM_OUTROS_ESTADOS),
      feriasNaoGozadasDias: sumDiasByTipo(militar.afastamentos, TipoAfastamentoReserva.FERIAS_NAO_GOZADAS),
      ltipDias: sumDiasByTipo(militar.afastamentos, TipoAfastamentoReserva.LTIP),
    };

    const calc = this.reservaService.calcular({
      postoGrad: normalizarPostoGrad(militar.postoGradOriginal),
      classe: definirClasse(normalizarPostoGrad(militar.postoGradOriginal)),
      sexo: militar.sexo === 'F' ? 'F' : 'M',
      dataIngresso: militar.dataIngresso,
      dataUltimaPromocao: militar.dataUltimaPromocao,
      dataNascimento: militar.dataNascimento,
      extras,
    });

    return this.prisma.militar.update({
      where: { id: militar.id },
      data: {
        tempoEfetivoDias: calc.tempoEfetivoDias,
        tempoTotalDias: calc.tempoTotalDias,
        reservaRequerimento: calc.reservaRequerimento,
        reservaCompulsoria: calc.reservaCompulsoria,
        classe: definirClasse(normalizarPostoGrad(militar.postoGradOriginal)),
      },
    });
  }
}
