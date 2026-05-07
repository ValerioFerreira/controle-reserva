import { Module } from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { SheetsController } from './sheets.controller';
import { ReservaService } from '../reserva/reserva.service';

@Module({
  controllers: [SheetsController],
  providers: [SheetsService, ReservaService],
})
export class SheetsModule {}
