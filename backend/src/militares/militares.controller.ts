import { Controller, Get, Param, Query } from '@nestjs/common';
import { MilitaresService } from './militares.service';
import { ListMilitaresDto } from './dto/list-militares.dto';

@Controller('militares')
export class MilitaresController {
  constructor(private readonly militaresService: MilitaresService) {}

  @Get()
  list(@Query() query: ListMilitaresDto) {
    return this.militaresService.list(query);
  }

  @Get('dashboard')
  dashboard() {
    return this.militaresService.dashboard();
  }

  @Get(':matricula')
  getByMatricula(@Param('matricula') matricula: string) {
    return this.militaresService.getByMatricula(matricula);
  }
}
