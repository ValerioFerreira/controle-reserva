import { Module } from '@nestjs/common';
import { AfastamentosService } from './afastamentos.service';
import { AfastamentosController } from './afastamentos.controller';
import { ReservaService } from '../reserva/reserva.service';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [LogsModule],
  controllers: [AfastamentosController],
  providers: [AfastamentosService, ReservaService],
})
export class AfastamentosModule {}
