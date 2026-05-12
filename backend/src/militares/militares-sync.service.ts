import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaExternoService } from '../prisma/prisma-externo.service';

@Injectable()
export class MilitaresSyncService {
  private readonly logger = new Logger(MilitaresSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly prismaExterno: PrismaExternoService,
  ) {}

  async syncMilitares() {
    this.logger.log('Iniciando sincronização de militares a partir da VIEW externa...');
    console.log('[MILITARES SYNC] Iniciando processo de sincronização...');

    try {
      console.log('[MILITARES] Consultando VIEW externa...');
      // Busca todos os registros com ordenação determinística
      const militaresExternos = await this.prismaExterno.militarExterno.findMany({
        orderBy: [
          { nome: 'asc' },
          { matricula: 'asc' }
        ]
      });

      console.log(`[MILITARES] Registros encontrados: ${militaresExternos.length}`);
      console.log('[MILITARES SYNC] Consulta externa finalizada com sucesso. Processando registros...');

      let totalProcessados = 0;
      let totalCriados = 0;
      let totalAtualizados = 0;

      const dataAtual = new Date();
      const anoAtual = dataAtual.getFullYear();

      for (let i = 0; i < militaresExternos.length; i++) {
        const ext = militaresExternos[i];
        const ordemHierarquica = i + 1; // Índice sequencial começando em 1

        // Logs a cada 1000 registros para indicar progresso
        if (i > 0 && i % 1000 === 0) {
          console.log(`[MILITARES SYNC] Lote processado: ${i} de ${militaresExternos.length}...`);
        }

        // Placeholder para data de nascimento
        let dataNascimento: Date | null = null;
        if (ext.idade) {
          dataNascimento = new Date(anoAtual - ext.idade, dataAtual.getMonth(), dataAtual.getDate());
        }

        const dadosMilitar = {
          postoGrad: ext.posto_grad,
          nome: ext.nome,
          sexo: ext.sexo,
          dataIngresso: ext.data_praca,
          dataUltimaPromocao: ext.data_ultima_promocao,
          dataNascimento: dataNascimento,
          ordemHierarquica: ordemHierarquica,
          reservaRequerimento: null,
          reservaCompulsoria: null,
        };

        try {
          const militarExistente = await this.prisma.militar.findUnique({
            where: { matricula: ext.matricula }
          });

          if (militarExistente) {
            await this.prisma.militar.update({
              where: { matricula: ext.matricula },
              data: dadosMilitar
            });
            totalAtualizados++;
          } else {
            await this.prisma.militar.create({
              data: {
                matricula: ext.matricula,
                ...dadosMilitar
              }
            });
            totalCriados++;
          }
        } catch (error: any) {
          this.logger.error(`Erro ao sincronizar militar ${ext.matricula}`, error);
          console.error(`[MILITARES SYNC ERROR] Militar ${ext.matricula}:`, error);
          if (error?.stack) console.error(error.stack);
        }

        totalProcessados++;
      }

      this.logger.log(`Sincronização concluída. Processados: ${totalProcessados}, Criados: ${totalCriados}, Atualizados: ${totalAtualizados}`);
      console.log(`[MILITARES SYNC] Sincronização concluída com sucesso.`);

      return {
        totalProcessados,
        totalCriados,
        totalAtualizados
      };
    } catch (error: any) {
      console.error('[MILITARES SYNC FATAL ERROR]', error);
      console.error(error?.stack);
      throw error;
    }
  }
}
