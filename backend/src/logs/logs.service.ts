import { Injectable } from '@nestjs/common';
import type { InputJsonValue } from '@prisma/client/runtime/library';
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

function toInputJsonValue(value: unknown): InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as InputJsonValue;
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
        payloadJson: toInputJsonValue({
          before: params.before,
          after: params.after,
          contexto: params.contexto ?? {},
        }),
      },
    });
  }
}
