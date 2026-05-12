import { Module } from '@nestjs/common';
import { MilitaresService } from './militares.service';
import { MilitaresController } from './militares.controller';
import { ReservaService } from '../reserva/reserva.service';

@Module({
  controllers: [MilitaresController],
  providers: [MilitaresService, ReservaService],
  exports: [MilitaresService],
})
export class MilitaresModule {}
