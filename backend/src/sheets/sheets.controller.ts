import { Controller, Post } from '@nestjs/common';
import { SheetsService, SyncResult } from './sheets.service';

@Controller('sheets')
export class SheetsController {
  constructor(private readonly sheetsService: SheetsService) {}

  @Post('sync')
  sync(): Promise<SyncResult> {
    return this.sheetsService.syncMilitares();
  }
}
