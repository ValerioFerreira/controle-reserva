import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MilitaresService } from './militares.service';
import { QueryMilitarDto } from './dto/query-militar.dto';
import { UpdateAbonoDto } from './dto/update-abono.dto';
import { MilitaresRecalcService } from './militares-recalc.service';

@Controller('militares')
@UseGuards(JwtAuthGuard)
export class MilitaresController {
  constructor(
    private readonly militaresService: MilitaresService,
    private readonly recalcService: MilitaresRecalcService,
  ) {}

  // CORREÇÃO 2: rota estática 'dashboard' ANTES da rota dinâmica ':matricula'
  @Get('dashboard')
  getDashboard() {
    return this.militaresService.getDashboard();
  }

  @Post('recalcular-reservas')
  recalcularReservas() {
    return this.recalcService.recalcularTodasReservas();
  }

  @Get()
  findAll(@Query() query: QueryMilitarDto) {
    return this.militaresService.findAll(query);
  }

  @Get('auditoria/:matricula')
  getAuditoria(@Param('matricula') matricula: string) {
    return this.militaresService.getAuditoria(matricula);
  }

  @Get(':matricula')
  findByMatricula(@Param('matricula') matricula: string) {
    return this.militaresService.findByMatricula(matricula);
  }

  @Patch(':matricula/abono')
  updateAbono(
    @Param('matricula') matricula: string,
    @Body() updateAbonoDto: UpdateAbonoDto,
  ) {
    return this.militaresService.updateAbono(matricula, updateAbonoDto);
  }
}
