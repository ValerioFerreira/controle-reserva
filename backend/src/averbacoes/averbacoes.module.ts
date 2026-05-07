import { Module } from '@nestjs/common';
import { MilitaresModule } from '../militares/militares.module';
import { AverbacoesController } from './averbacoes.controller';
import { AverbacoesService } from './averbacoes.service';

@Module({
  imports: [MilitaresModule],
  controllers: [AverbacoesController],
  providers: [AverbacoesService],
})
export class AverbacoesModule {}
