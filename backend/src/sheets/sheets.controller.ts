import { Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SheetsService } from './sheets.service';

@Controller('sheets')
@UseGuards(JwtAuthGuard)
export class SheetsController {
  constructor(private readonly sheetsService: SheetsService) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async sync() {
    return this.sheetsService.sync();
  }
}
