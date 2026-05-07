import { Module } from '@nestjs/common';
import { MilitaresService } from './militares.service';
import { MilitaresController } from './militares.controller';

@Module({
  controllers: [MilitaresController],
  providers: [MilitaresService],
  exports: [MilitaresService],
})
export class MilitaresModule {}
