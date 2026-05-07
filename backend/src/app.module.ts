import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MilitaresModule } from './militares/militares.module';
import { AverbacoesModule } from './averbacoes/averbacoes.module';
import { AfastamentosModule } from './afastamentos/afastamentos.module';
import { ReservaModule } from './reserva/reserva.module';
import { SheetsModule } from './sheets/sheets.module';
import { LogsModule } from './logs/logs.module';
import { UsuariosModule } from './usuarios/usuarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MilitaresModule,
    AverbacoesModule,
    AfastamentosModule,
    ReservaModule,
    SheetsModule,
    LogsModule,
    UsuariosModule,
  ],
})
export class AppModule {}
