import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { AfastamentosService } from './afastamentos.service';
import { UpsertAfastamentoDto } from './dto/upsert-afastamento.dto';

@Controller('militares/:matricula/afastamentos')
export class AfastamentosController {
  constructor(private readonly afastamentosService: AfastamentosService) {}

  @Get()
  list(@Param('matricula') matricula: string) {
    return this.afastamentosService.list(matricula);
  }

  @Post()
  create(
    @Param('matricula') matricula: string,
    @Body() dto: UpsertAfastamentoDto,
  ) {
    return this.afastamentosService.create(matricula, dto);
  }

  @Put(':id')
  update(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertAfastamentoDto,
  ) {
    return this.afastamentosService.update(matricula, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.afastamentosService.remove(matricula, id);
  }
}
