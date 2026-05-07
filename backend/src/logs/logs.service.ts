import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateLogParams {
  usuarioId?: number;
  militarId?: number;
  acao: 'CREATE' | 'UPDATE' | 'DELETE';
  entidade: string;
  entidadeId: string;
  before?: unknown;
  after?: unknown;
  contexto?: Record<string, unknown>;
}

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(params: CreateLogParams) {
    return this.prisma.log.create({
      data: {
        usuarioId: params.usuarioId,
        militarId: params.militarId,
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId,
        payloadJson: {
          before: params.before ?? null,
          after: params.after ?? null,
          contexto: params.contexto ?? {},
        },
      },
    });
  }
}
