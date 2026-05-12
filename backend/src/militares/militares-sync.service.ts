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

    // Busca todos os registros com ordenação determinística
    const militaresExternos = await this.prismaExterno.militarExterno.findMany({
      orderBy: [
        { nome: 'asc' },
        { matricula: 'asc' }
      ]
    });

    let totalProcessados = 0;
    let totalCriados = 0;
    let totalAtualizados = 0;

    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();

    for (let i = 0; i < militaresExternos.length; i++) {
      const ext = militaresExternos[i];
      const ordemHierarquica = i + 1; // Índice sequencial começando em 1

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
      } catch (error) {
        this.logger.error(`Erro ao sincronizar militar ${ext.matricula}`, error);
      }

      totalProcessados++;
    }

    this.logger.log(`Sincronização concluída. Processados: ${totalProcessados}, Criados: ${totalCriados}, Atualizados: ${totalAtualizados}`);

    return {
      totalProcessados,
      totalCriados,
      totalAtualizados
    };
  }
}
