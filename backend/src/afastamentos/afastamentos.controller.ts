import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AfastamentosService } from './afastamentos.service';
import { CreateAfastamentoDto } from './dto/create-afastamento.dto';
import { UpdateAfastamentoDto } from './dto/update-afastamento.dto';

@Controller('militares/:matricula/afastamentos')
@UseGuards(JwtAuthGuard)
export class AfastamentosController {
  constructor(private readonly afastamentosService: AfastamentosService) {}

  @Get()
  findAll(@Param('matricula') matricula: string) {
    return this.afastamentosService.findByMatricula(matricula);
  }

  @Post()
  create(
    @Param('matricula') matricula: string,
    @Body() dto: CreateAfastamentoDto,
    @Request() req: any,
  ) {
    return this.afastamentosService.create(matricula, dto, req.user?.userId);
  }

  @Put(':id')
  update(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() rawBody: any,
    @Request() req: any,
  ) {
    console.log('[AFASTAMENTO PUT] RAW BODY RECEBIDO:', JSON.stringify(rawBody));

    // Mapear manualmente para o DTO para evitar problema do ValidationPipe
    const dto: UpdateAfastamentoDto = {};
    if (rawBody.tipo !== undefined)               dto.tipo = rawBody.tipo;
    if (rawBody.dias !== undefined)               dto.dias = Number(rawBody.dias);
    if (rawBody.processoSeiMilitar !== undefined) dto.processoSeiMilitar = rawBody.processoSeiMilitar;
    if (rawBody.obs !== undefined)                dto.obs = rawBody.obs;

    console.log('[AFASTAMENTO PUT] DTO MONTADO:', JSON.stringify(dto));

    return this.afastamentosService.update(id, matricula, dto, req.user?.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.afastamentosService.remove(id, matricula, req.user?.userId);
  }
}
