import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';

@Injectable()
export class MilitaresRecalcService {
  private readonly logger = new Logger(MilitaresRecalcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservaService: ReservaService,
  ) {}

  async recalcularTodasReservas() {
    this.logger.log('Iniciando recálculo global das datas de reserva sob demanda...');
    const startTime = Date.now();
    let processados = 0;
    let erros = 0;
    
    try {
      const militares = await this.prisma.militar.findMany({
        select: { id: true }, // Buscar apenas o ID inicialmente para otimizar memória
      });
      
      const total = militares.length;
      this.logger.log(`Quantidade total de militares a processar: ${total}`);

      if (total === 0) {
        this.logger.log('Nenhum militar encontrado. Recálculo finalizado.');
        return { total, processados: 0, erros: 0, durationMs: Date.now() - startTime };
      }

      // Processamento puramente sequencial para evitar exaustão do pool de conexões (Neon)
      for (const m of militares) {
        try {
          const militar = await this.prisma.militar.findUnique({
            where: { id: m.id },
            include: {
              averbacoes: true,
              afastamentos: true,
            },
          });

          if (!militar) continue;

          const calc = this.reservaService.calcularDatasReserva(
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
            this.logger.warn(`Militar matrícula ${militar.matricula} com aviso no cálculo: ${calc.aviso}`);
            erros++;
          }
        } catch (err: any) {
          this.logger.error(`Erro ao recalcular militar ID ${m.id}: ${err?.message}`, err?.stack);
          erros++;
        }
      }

      const durationMs = Date.now() - startTime;
      this.logger.log(`Recálculo global concluído. Processados: ${processados}, Erros: ${erros}, Tempo: ${durationMs}ms`);
      
      return { total, processados, erros, durationMs };
    } catch (error: any) {
      this.logger.error('Erro fatal durante o recálculo global:', error?.stack);
      throw error;
    }
  }
}
