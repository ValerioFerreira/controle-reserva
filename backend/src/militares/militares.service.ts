import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMilitarDto } from './dto/query-militar.dto';

// Alerta: dias até a data mais próxima (requerimento ou compulsória)
function getDaysUntil(date: Date | null): number {
  if (!date) return Infinity;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - hoje.getTime()) / 86400000);
}

@Injectable()
export class MilitaresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMilitarDto) {
    const { matricula, nome, postoGrad, dataInicio, dataFim, alerta, page = 1, limit = 20 } = query;

    const where: any = {};

    if (matricula) {
      where.matricula = { contains: matricula };
    }
    if (nome) {
      where.nome = { contains: nome, mode: 'insensitive' };
    }
    if (postoGrad) {
      where.postoGrad = postoGrad;
    }

    // Filtro de datas de reserva
    if (dataInicio || dataFim) {
      const dateFilter: any = {};
      if (dataInicio) dateFilter.gte = new Date(dataInicio);
      if (dataFim) dateFilter.lte = new Date(dataFim);

      where.OR = [
        { reservaRequerimento: dateFilter },
        { reservaCompulsoria: dateFilter },
      ];
    }

    // ADENDO 3: Ordenação sempre por ordemHierarquica ASC
    const [militares, total] = await Promise.all([
      this.prisma.militar.findMany({
        where,
        orderBy: { ordemHierarquica: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.militar.count({ where }),
    ]);

    // Filtro de alerta (feito em memória pois depende de cálculo dinâmico)
    let data = militares;
    if (alerta) {
      data = militares.filter((m) => {
        const dReq = getDaysUntil(m.reservaRequerimento);
        const dComp = getDaysUntil(m.reservaCompulsoria);
        const minDays = Math.min(dReq, dComp);

        if (alerta === 'vermelho') return minDays <= 30;
        if (alerta === 'amarelo') return minDays > 30 && minDays <= 90;
        return true;
      });
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  async getDashboard() {
    const militares = await this.prisma.militar.findMany({
      select: {
        reservaRequerimento: true,
        reservaCompulsoria: true,
      },
    });

    const totalMilitares = militares.length;

    const alertaVermelho = militares.filter((m) => {
      const dReq = getDaysUntil(m.reservaRequerimento);
      const dComp = getDaysUntil(m.reservaCompulsoria);
      return Math.min(dReq, dComp) <= 30;
    }).length;

    const alertaAmarelo = militares.filter((m) => {
      const dReq = getDaysUntil(m.reservaRequerimento);
      const dComp = getDaysUntil(m.reservaCompulsoria);
      const minDays = Math.min(dReq, dComp);
      return minDays > 30 && minDays <= 90;
    }).length;

    return { totalMilitares, alertaVermelho, alertaAmarelo };
  }

  async findByMatricula(matricula: string) {
    const militar = await this.prisma.militar.findUnique({
      where: { matricula },
      include: {
        averbacoes: { orderBy: { createdAt: 'desc' } },
        afastamentos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!militar) {
      throw new NotFoundException(`Militar com matrícula ${matricula} não encontrado`);
    }

    return militar;
  }
}
