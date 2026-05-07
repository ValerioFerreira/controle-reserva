import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MilitaresModule } from './militares/militares.module';
import { AverbacaoesModule } from './averbacoes/averbacoes.module';
import { AfastamentosModule } from './afastamentos/afastamentos.module';
import { LogsModule } from './logs/logs.module';
import { SheetsModule } from './sheets/sheets.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MilitaresModule,
    AverbacaoesModule,
    AfastamentosModule,
    LogsModule,
    SheetsModule,
  ],
})
export class AppModule {}
