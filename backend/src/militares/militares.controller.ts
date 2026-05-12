import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MilitaresService } from './militares.service';
import { QueryMilitarDto } from './dto/query-militar.dto';

@Controller('militares')
@UseGuards(JwtAuthGuard)
export class MilitaresController {
  constructor(private readonly militaresService: MilitaresService) {}

  // CORREÇÃO 2: rota estática 'dashboard' ANTES da rota dinâmica ':matricula'
  @Get('dashboard')
  getDashboard() {
    return this.militaresService.getDashboard();
  }

  @Get()
  findAll(@Query() query: QueryMilitarDto) {
    return this.militaresService.findAll(query);
  }

  @Get(':matricula')
  findByMatricula(@Param('matricula') matricula: string) {
    return this.militaresService.findByMatricula(matricula);
  }
}
