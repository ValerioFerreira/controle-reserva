import { Module } from '@nestjs/common';
import { MilitaresModule } from '../militares/militares.module';
import { SheetsController } from './sheets.controller';
import { SheetsService } from './sheets.service';

@Module({
  imports: [MilitaresModule],
  controllers: [SheetsController],
  providers: [SheetsService],
})
export class SheetsModule {}
