import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';
import { ReservaLegacyService } from '../reserva/reserva-legacy.service';

/** Interface mínima comum a ambos os serviços de cálculo */
type IReservaService = Pick<ReservaService | ReservaLegacyService, 'calcularDatasReserva'>;

@Injectable()
export class MilitaresRecalcService {
  private readonly logger = new Logger(MilitaresRecalcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservaService: ReservaService,
    private readonly reservaLegacyService: ReservaLegacyService,
  ) {}

  async recalcularTodasReservas(modo: 'novo' | 'legado' = 'novo') {
    const servico: IReservaService =
      modo === 'legado' ? this.reservaLegacyService : this.reservaService;

    const label = modo === 'legado' ? 'LEGADO' : 'NOVO';
    this.logger.log(`Iniciando recálculo global [${label}] sob demanda...`);
    const startTime = Date.now();
    let processados = 0;
    let erros = 0;

    try {
      const militares = await this.prisma.militar.findMany({
        select: { id: true },
      });

      const total = militares.length;
      this.logger.log(`Total de militares a processar: ${total}`);

      if (total === 0) {
        return { total, processados: 0, erros: 0, durationMs: Date.now() - startTime, modo };
      }

      for (const m of militares) {
        try {
          const militar = await this.prisma.militar.findUnique({
            where: { id: m.id },
            include: { averbacoes: true, afastamentos: true },
          });

          if (!militar) continue;

          const calc = servico.calcularDatasReserva(
            militar,
            militar.averbacoes,
            militar.afastamentos,
          );

          if (calc.ok) {
            await this.prisma.militar.update({
              where: { id: militar.id },
              data: {
                reservaRequerimento: calc.reservaRequerimento,
                reservaCompulsoria: calc.reservaCompulsoria,
              },
            });
            processados++;
          } else {
            this.logger.warn(`Matrícula ${militar.matricula}: ${(calc as any).aviso}`);
            erros++;
          }
        } catch (err: any) {
          this.logger.error(`Erro ao recalcular ID ${m.id}: ${err?.message}`, err?.stack);
          erros++;
        }
      }

      const durationMs = Date.now() - startTime;
      this.logger.log(`Recálculo [${label}] concluído. Processados: ${processados}, Erros: ${erros}, Tempo: ${durationMs}ms`);

      return { total, processados, erros, durationMs, modo };
    } catch (error: any) {
      this.logger.error('Erro fatal durante o recálculo:', error?.stack);
      throw error;
    }
  }
}
