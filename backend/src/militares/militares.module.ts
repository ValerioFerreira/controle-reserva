import { Module } from '@nestjs/common';
import { MilitaresService } from './militares.service';
import { MilitaresController } from './militares.controller';
import { ReservaService } from '../reserva/reserva.service';
import { MilitaresRecalcService } from './militares-recalc.service';

@Module({
  controllers: [MilitaresController],
  providers: [MilitaresService, ReservaService, MilitaresRecalcService],
  exports: [MilitaresService],
})
export class MilitaresModule {}
