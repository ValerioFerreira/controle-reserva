import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';
import { QueryMilitarDto } from './dto/query-militar.dto';
import { UpdateAbonoDto } from './dto/update-abono.dto';

// Alerta: dias até a data mais próxima (requerimento ou compulsória)
function getDaysUntil(date: Date | null): number {
  if (!date) return Infinity;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - hoje.getTime()) / 86400000);
}

@Injectable()
export class MilitaresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservaService: ReservaService,
  ) {}

  async findAll(query: QueryMilitarDto) {
    try {
      const { matricula, nome, postoGrad, dataInicio, dataFim, alerta, abono, pcnh, page = 1, limit = 20 } = query;

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
      if (abono === 'com_abono') {
        where.abonoPermanencia = true;
      } else if (abono === 'sem_abono') {
        where.abonoPermanencia = false;
      }

      if (pcnh === 'com_pcnh') {
        where.pcnh = true;
      } else if (pcnh === 'sem_pcnh') {
        where.pcnh = false;
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

      console.log('[MILITARES] Consultando banco...');
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

      console.log(`[MILITARES] Registros encontrados: ${militares.length}`);

      // 1. Identificar militares sem datas de reserva calculadas
      const militaresFaltando = militares.filter(
        (m) => m.reservaRequerimento === null || m.reservaCompulsoria === null
      );

      if (militaresFaltando.length > 0) {
        console.log(`[MILITARES] Calculando reservas pendentes para ${militaresFaltando.length} militares...`);
        await Promise.all(
          militaresFaltando.map(async (militar) => {
            const averbacoes = await this.prisma.averbacao.findMany({ where: { militarId: militar.id } });
            const afastamentos = await this.prisma.afastamento.findMany({ where: { militarId: militar.id } });

            const calc = this.reservaService.calcularDatasReserva(
              militar,
              averbacoes,
              afastamentos
            );

            if (calc.ok) {
              await this.prisma.militar.update({
                where: { id: militar.id },
                data: {
                  reservaRequerimento: calc.reservaRequerimento,
                  reservaCompulsoria: calc.reservaCompulsoria,
                },
              });
              militar.reservaRequerimento = calc.reservaRequerimento;
              militar.reservaCompulsoria = calc.reservaCompulsoria;
            }
          })
        );
      }

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
    } catch (error: any) {
      console.error('[MILITARES SERVICE ERROR]', error);
      console.error(error?.stack);
      throw error;
    }
  }

  async getDashboard() {
    try {
      console.log('[MILITARES] Consultando banco (dashboard)...');
      const militares = await this.prisma.militar.findMany({
        select: {
          reservaRequerimento: true,
          reservaCompulsoria: true,
        },
      });

      console.log(`[MILITARES] Registros encontrados: ${militares.length}`);

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
    } catch (error: any) {
      console.error('[MILITARES SERVICE ERROR]', error);
      console.error(error?.stack);
      throw error;
    }
  }

  async findByMatricula(matricula: string) {
    try {
      console.log(`[MILITARES] Consultando matrícula: ${matricula}`);
      const militar = await this.prisma.militar.findUnique({
        where: { matricula },
        include: {
          averbacoes: { orderBy: { createdAt: 'desc' } },
          afastamentos: { orderBy: { createdAt: 'desc' } },
        },
      });

      console.log(`[MILITARES] Registros encontrados: ${militar ? 1 : 0}`);

      if (!militar) {
        throw new NotFoundException(`Militar com matrícula ${matricula} não encontrado`);
      }

      if (militar.reservaRequerimento === null || militar.reservaCompulsoria === null) {
        console.log(`[MILITARES] Calculando reservas pendentes para matrícula ${matricula}...`);
        const calc = this.reservaService.calcularDatasReserva(
          militar,
          militar.averbacoes,
          militar.afastamentos
        );

        if (calc.ok) {
          await this.prisma.militar.update({
            where: { id: militar.id },
            data: {
              reservaRequerimento: calc.reservaRequerimento,
              reservaCompulsoria: calc.reservaCompulsoria,
            },
          });
          militar.reservaRequerimento = calc.reservaRequerimento as any;
          militar.reservaCompulsoria = calc.reservaCompulsoria as any;
        }
      }

      return militar;
    } catch (error: any) {
      console.error('[MILITARES SERVICE ERROR]', error);
      console.error(error?.stack);
      throw error;
    }
  }

  async updateAbono(matricula: string, data: UpdateAbonoDto) {
    try {
      const militar = await this.prisma.militar.findUnique({ where: { matricula } });
      if (!militar) {
        throw new NotFoundException(`Militar com matrícula ${matricula} não encontrado`);
      }

      return await this.prisma.militar.update({
        where: { matricula },
        data: {
          abonoPermanencia: data.abonoPermanencia,
          dataInicioAbono: data.dataInicioAbono ? new Date(data.dataInicioAbono) : null,
        },
      });
    } catch (error: any) {
      console.error('[MILITARES SERVICE ERROR]', error);
      console.error(error?.stack);
      throw error;
    }
  }
}
