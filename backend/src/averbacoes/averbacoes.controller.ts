import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { AverbacoesService } from './averbacoes.service';
import { UpsertAverbacaoDto } from './dto/upsert-averbacao.dto';

@Controller('militares/:matricula/averbacoes')
export class AverbacoesController {
  constructor(private readonly averbacoesService: AverbacoesService) {}

  @Get()
  list(@Param('matricula') matricula: string) {
    return this.averbacoesService.list(matricula);
  }

  @Post()
  create(
    @Param('matricula') matricula: string,
    @Body() dto: UpsertAverbacaoDto,
  ) {
    return this.averbacoesService.create(matricula, dto);
  }

  @Put(':id')
  update(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertAverbacaoDto,
  ) {
    return this.averbacoesService.update(matricula, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.averbacoesService.remove(matricula, id);
  }
}
