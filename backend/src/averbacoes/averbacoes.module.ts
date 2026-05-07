import { Module } from '@nestjs/common';
import { AverbacaoesService } from './averbacoes.service';
import { AverbacaoesController } from './averbacoes.controller';
import { ReservaService } from '../reserva/reserva.service';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [LogsModule],
  controllers: [AverbacaoesController],
  providers: [AverbacaoesService, ReservaService],
})
export class AverbacaoesModule {}
