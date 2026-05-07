import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(params: {
    usuarioId?: number;
    acao: 'CREATE' | 'UPDATE' | 'DELETE' | string;
    entidade: 'Averbacao' | 'Afastamento' | 'Militar' | string;
    entidadeId: string;
    militarId?: number;
    dadosAntigos?: any;
    dadosNovos?: any;
    contexto?: string;
  }): Promise<void> {
    try {
      const { usuarioId, acao, entidade, entidadeId, militarId, dadosAntigos, dadosNovos, contexto } = params;

      await this.prisma.log.create({
        data: {
          usuarioId: usuarioId || null,
          acao,
          entidade,
          entidadeId: String(entidadeId),
          militarId: militarId || null,
          payloadJson: {
            antes: dadosAntigos || null,
            depois: dadosNovos || null,
            contexto: contexto || null,
          },
        },
      });
    } catch (err) {
      // Logs nunca devem quebrar o fluxo principal
      console.error('[LogsService] Falha ao gravar log:', err.message);
    }
  }
}
