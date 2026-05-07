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
    @Body() dto: UpdateAverbacaoDto,
    @Request() req: any,
  ) {
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
