import { Module } from '@nestjs/common';
import { MilitaresModule } from '../militares/militares.module';
import { AfastamentosController } from './afastamentos.controller';
import { AfastamentosService } from './afastamentos.service';

@Module({
  imports: [MilitaresModule],
  controllers: [AfastamentosController],
  providers: [AfastamentosService],
})
export class AfastamentosModule {}
