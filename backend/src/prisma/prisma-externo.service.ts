import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '.prisma/client-externo';

@Injectable()
export class PrismaExternoService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
      ],
    });

    // @ts-ignore
    this.$on('query', (e: any) => {
      console.log('[PRISMA QUERY]', e.query);
    });

    // @ts-ignore
    this.$on('error', (e: any) => {
      console.error('[PRISMA ERROR]', e);
    });
  }

  async onModuleInit() {
    try {
      console.log('[PRISMA EXTERNO] Iniciando conexão...');
      await this.$connect();
      console.log('[PRISMA EXTERNO] Conexão estabelecida com sucesso.');
    } catch (error) {
      console.error('[PRISMA EXTERNO] Erro ao conectar:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
