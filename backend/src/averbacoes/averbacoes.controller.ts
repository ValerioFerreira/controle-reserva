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
import { AverbacaoesService } from './averbacoes.service';
import { CreateAverbacaoDto } from './dto/create-averbacao.dto';
import { UpdateAverbacaoDto } from './dto/update-averbacao.dto';

@Controller('militares/:matricula/averbacoes')
@UseGuards(JwtAuthGuard)
export class AverbacaoesController {
  constructor(private readonly averbacaoesService: AverbacaoesService) {}

  @Get()
  findAll(@Param('matricula') matricula: string) {
    return this.averbacaoesService.findByMatricula(matricula);
  }

  @Post()
  create(
    @Param('matricula') matricula: string,
    @Body() dto: CreateAverbacaoDto,
    @Request() req: any,
  ) {
    return this.averbacaoesService.create(matricula, dto, req.user?.userId);
  }

  @Put(':id')
  update(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() rawBody: any,
    @Request() req: any,
  ) {
    console.log('[AVERBACAO PUT] RAW BODY RECEBIDO:', JSON.stringify(rawBody));

    // Mapear manualmente para o DTO para evitar problema do ValidationPipe
    const dto: UpdateAverbacaoDto = {};
    if (rawBody.tipo !== undefined)               dto.tipo = rawBody.tipo;
    if (rawBody.dias !== undefined)               dto.dias = Number(rawBody.dias);
    if (rawBody.processoSeiMilitar !== undefined) dto.processoSeiMilitar = rawBody.processoSeiMilitar;
    if (rawBody.processoSeiInss !== undefined)    dto.processoSeiInss = rawBody.processoSeiInss;
    if (rawBody.obs !== undefined)                dto.obs = rawBody.obs;

    console.log('[AVERBACAO PUT] DTO MONTADO:', JSON.stringify(dto));

    return this.averbacaoesService.update(id, matricula, dto, req.user?.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('matricula') matricula: string,
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.averbacaoesService.remove(id, matricula, req.user?.userId);
  }
}
