import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaExternoService } from './prisma-externo.service';

@Global()
@Module({
  providers: [PrismaService, PrismaExternoService],
  exports: [PrismaService, PrismaExternoService],
})
export class PrismaModule {}
