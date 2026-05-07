import { Module } from '@nestjs/common';
import { ReservaService } from './reserva.service';

@Module({
  providers: [ReservaService],
  exports: [ReservaService],
})
export class ReservaModule {}
