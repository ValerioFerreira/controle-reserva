import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';

@Injectable()
export class MilitaresRecalcService implements OnModuleInit {
  private readonly logger = new Logger(MilitaresRecalcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservaService: ReservaService,
  ) {}

  onModuleInit() {
    // Lançar o processo em background para não travar o startup da aplicação
    this.recalcularTodasReservas().catch((err) => {
      this.logger.error('Erro fatal no recálculo de reservas em background', err);
    });
  }

  private async recalcularTodasReservas() {
    this.logger.log('Iniciando recálculo global das datas de reserva em background...');
    
    try {
      const militares = await this.prisma.militar.findMany({
        select: { id: true }, // Buscar apenas o ID inicialmente para otimizar memória
      });
      
      const total = militares.length;
      this.logger.log(`Quantidade total de militares a processar: ${total}`);

      if (total === 0) {
        this.logger.log('Nenhum militar encontrado. Recálculo finalizado.');
        return;
      }

      const BATCH_SIZE = 100;
      let processedCount = 0;
      
      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = militares.slice(i, i + BATCH_SIZE);
        this.logger.log(`Processando batch ${Math.floor(i / BATCH_SIZE) + 1} de ${Math.ceil(total / BATCH_SIZE)}...`);
        
        await Promise.all(
          batch.map(async (m) => {
            try {
              // Buscar os dados completos do militar, incluindo averbações e afastamentos
              const militar = await this.prisma.militar.findUnique({
                where: { id: m.id },
                include: {
                  averbacoes: true,
                  afastamentos: true,
                },
              });

              if (!militar) return;

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
              } else {
                this.logger.warn(`Militar matrícula ${militar.matricula} com aviso no cálculo: ${calc.aviso}`);
              }
            } catch (err: any) {
              this.logger.error(`Erro ao recalcular militar ID ${m.id}: ${err?.message}`, err?.stack);
            }
          })
        );
        
        processedCount += batch.length;
        this.logger.log(`Progresso: ${processedCount}/${total} militares processados.`);
      }

      this.logger.log('Recálculo global das datas de reserva finalizado com sucesso!');
    } catch (error: any) {
      this.logger.error('Erro durante o recálculo global:', error?.stack);
    }
  }
}
