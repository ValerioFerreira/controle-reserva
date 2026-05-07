import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { LogsService } from '../logs/logs.service';
import { MilitaresService } from '../militares/militares.service';
import { PrismaService } from '../prisma/prisma.service';
import { definirClasse, normalizarPostoGrad, parsePtBrDate } from '../reserva/reserva.utils';

export interface SyncResult {
  inserted: number;
  updated: number;
  errors: string[];
}

@Injectable()
export class SheetsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly militaresService: MilitaresService,
    private readonly logsService: LogsService,
  ) {}

  async syncMilitares(): Promise<SyncResult> {
    const url = this.configService.get<string>('CSV_PUBLIC_URL');
    const insertedUpdated = { inserted: 0, updated: 0, errors: [] as string[] };
    const response = await axios.get(url!, { timeout: 20000 });
    const records: string[][] = parse(response.data, {
      skip_empty_lines: true,
    });

    for (let index = 1; index < records.length; index += 1) {
      const row = records[index];
      const matricula = row[6]?.trim();
      if (!matricula) continue;
      try {
        const postoGradOriginal = row[1]?.trim();
        const postoGradNormalizado = normalizarPostoGrad(postoGradOriginal);
        const payload = {
          matricula,
          postoGradOriginal,
          postoGradNormalizado,
          nome: row[7]?.trim(),
          ordemHierarquica: Number(row[12] || 0),
          sexo: row[8]?.trim()?.toUpperCase().startsWith('F') ? 'F' : 'M',
          dataIngresso: parsePtBrDate(row[9]),
          dataUltimaPromocao: parsePtBrDate(row[10]),
          dataNascimento: parsePtBrDate(row[11]),
          classe: definirClasse(postoGradNormalizado),
        };

        const existing = await this.prisma.militar.findUnique({
          where: { matricula },
          select: { id: true },
        });

        if (existing) {
          await this.prisma.militar.update({ where: { matricula }, data: payload });
          insertedUpdated.updated += 1;
        } else {
          await this.prisma.militar.create({ data: payload });
          insertedUpdated.inserted += 1;
        }

        const recalculated = await this.militaresService.recalculateByMatricula(matricula);
        await this.logsService.createLog({
          acao: existing ? 'UPDATE' : 'CREATE',
          entidade: 'MILITAR_SYNC',
          entidadeId: String(recalculated.id),
          militarId: recalculated.id,
          after: recalculated,
          contexto: { source: 'google-sheets-csv' },
        });
      } catch (error) {
        insertedUpdated.errors.push(
          `Linha ${index + 1}: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
        );
      }
    }

    return insertedUpdated;
  }
}
