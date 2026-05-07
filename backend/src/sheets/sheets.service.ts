import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';
import axios from 'axios';
import { parse } from 'csv-parse/sync';

// URL pública do CSV da planilha Google Sheets
const SHEETS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQAxMujBpwf_zdT5wosb36fRu1TUTJY3QiRGdwJVY3ICm5tfyPQRrhMq15G493eSvYyP1_8wmYgWJKo/pub?gid=1611632492&single=true&output=csv';

// CORREÇÃO 1: mapeamento posicional 0-based
// índice 0  → Nº (ignorar)
// índice 1  → postoGrad
// índice 6  → matricula
// índice 7  → nome
// índice 8  → sexo
// índice 9  → dataIngresso (DD/MM/YYYY)
// índice 10 → dataUltimaPromocao (DD/MM/YYYY)
// índice 11 → dataNascimento (DD/MM/YYYY)
// índice 12 → ordemHierarquica (inteiro)

function parseDateBR(value: string): Date | null {
  if (!value || !value.trim()) return null;
  const parts = value.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(date.getTime())) return null;
  return date;
}

@Injectable()
export class SheetsService {
  private readonly logger = new Logger(SheetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reservaService: ReservaService,
  ) {}

  async sync(): Promise<{ inserted: number; updated: number; errors: string[] }> {
    const inserted = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    // 1. Baixar o CSV
    let csvText: string;
    try {
      const response = await axios.get(SHEETS_CSV_URL, {
        responseType: 'text',
        timeout: 30000,
      });
      csvText = response.data;
    } catch (err) {
      const msg = `Falha ao baixar CSV: ${err.message}`;
      this.logger.error(msg);
      return { inserted: 0, updated: 0, errors: [msg] };
    }

    // 2. Parsear o CSV (primeira linha = cabeçalho, ignorar)
    let rows: string[][];
    try {
      rows = parse(csvText, {
        skip_empty_lines: true,
        relax_column_count: true,
      }) as string[][];
    } catch (err) {
      const msg = `Falha ao parsear CSV: ${err.message}`;
      this.logger.error(msg);
      return { inserted: 0, updated: 0, errors: [msg] };
    }

    // Ignorar a primeira linha (cabeçalho)
    const dataRows = rows.slice(1);

    // 3. Processar cada linha
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const lineNum = i + 2; // +2 porque começamos do índice 1 (cabeçalho) e o usuário conta de 1

      try {
        // Usar índices posicionais 0-based (CORREÇÃO 1)
        const postoGrad = row[1]?.trim() || '';
        const matricula = row[6]?.trim() || '';
        const nome = row[7]?.trim() || '';
        const sexo = row[8]?.trim() || '';
        const dataIngressoStr = row[9]?.trim() || '';
        const dataUltimaPromocaoStr = row[10]?.trim() || '';
        const dataNascimentoStr = row[11]?.trim() || '';
        const ordemHierarquicaStr = row[12]?.trim() || '';

        // Ignorar linhas com matrícula vazia
        if (!matricula) continue;

        const dataIngresso = parseDateBR(dataIngressoStr);
        const dataUltimaPromocao = parseDateBR(dataUltimaPromocaoStr);
        const dataNascimento = parseDateBR(dataNascimentoStr);
        const ordemHierarquica = parseInt(ordemHierarquicaStr, 10);

        // Validações mínimas
        if (!dataIngresso) {
          errors.push(`Linha ${lineNum} (matrícula ${matricula}): data de ingresso inválida "${dataIngressoStr}"`);
          continue;
        }
        if (!dataUltimaPromocao) {
          errors.push(`Linha ${lineNum} (matrícula ${matricula}): data de última promoção inválida "${dataUltimaPromocaoStr}"`);
          continue;
        }
        if (!dataNascimento) {
          errors.push(`Linha ${lineNum} (matrícula ${matricula}): data de nascimento inválida "${dataNascimentoStr}"`);
          continue;
        }
        if (isNaN(ordemHierarquica)) {
          errors.push(`Linha ${lineNum} (matrícula ${matricula}): ordem hierárquica inválida "${ordemHierarquicaStr}"`);
          continue;
        }

        const dadosMilitar = {
          postoGrad,
          nome,
          sexo,
          dataIngresso,
          dataUltimaPromocao,
          dataNascimento,
          ordemHierarquica,
        };

        // 4. Upsert por matrícula
        const existente = await this.prisma.militar.findUnique({ where: { matricula } });

        let militarId: number;

        if (existente) {
          // Atualizar campos da planilha sem tocar em averbações/afastamentos/logs
          await this.prisma.militar.update({
            where: { matricula },
            data: dadosMilitar,
          });
          militarId = existente.id;
          updatedCount++;
        } else {
          // Inserir novo
          const novo = await this.prisma.militar.create({
            data: { matricula, ...dadosMilitar },
          });
          militarId = novo.id;
          insertedCount++;
        }

        // 5. Recalcular datas de reserva após upsert
        const militarCompleto = await this.prisma.militar.findUnique({
          where: { id: militarId },
          include: { averbacoes: true, afastamentos: true },
        });

        if (militarCompleto) {
          const resultado = this.reservaService.calcularDatasReserva(
            militarCompleto,
            militarCompleto.averbacoes,
            militarCompleto.afastamentos,
          );

          if (resultado.ok) {
            await this.prisma.militar.update({
              where: { id: militarId },
              data: {
                reservaRequerimento: resultado.reservaRequerimento,
                reservaCompulsoria: resultado.reservaCompulsoria,
              },
            });
          }
        }
      } catch (err) {
        const msg = `Linha ${lineNum}: erro inesperado — ${err.message}`;
        this.logger.error(msg);
        errors.push(msg);
      }
    }

    this.logger.log(`Sync concluído: ${insertedCount} inseridos, ${updatedCount} atualizados, ${errors.length} erros`);

    return { inserted: insertedCount, updated: updatedCount, errors };
  }
}
