import { Module } from '@nestjs/common';
import { MilitaresService } from './militares.service';
import { MilitaresController } from './militares.controller';
import { MilitaresSyncService } from './militares-sync.service';

@Module({
  controllers: [MilitaresController],
  providers: [MilitaresService, MilitaresSyncService],
  exports: [MilitaresService, MilitaresSyncService],
})
export class MilitaresModule {}
