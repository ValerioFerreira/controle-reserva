import { Module } from '@nestjs/common';
import { ReservaModule } from '../reserva/reserva.module';
import { MilitaresController } from './militares.controller';
import { MilitaresService } from './militares.service';

@Module({
  imports: [ReservaModule],
  controllers: [MilitaresController],
  providers: [MilitaresService],
  exports: [MilitaresService],
})
export class MilitaresModule {}
