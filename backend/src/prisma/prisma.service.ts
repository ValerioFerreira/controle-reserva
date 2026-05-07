import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaService | undefined;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
    if (!global.prismaGlobal) {
      global.prismaGlobal = this;
    }
    return global.prismaGlobal;
  }

  async onModuleInit() {
    await this.$connect();
  }
}
