import { Injectable, NotFoundException } from '@nestjs/common';
import { LogsService } from '../logs/logs.service';
import { MilitaresService } from '../militares/militares.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAfastamentoDto } from './dto/upsert-afastamento.dto';

@Injectable()
export class AfastamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly militaresService: MilitaresService,
    private readonly logsService: LogsService,
  ) {}

  async list(matricula: string) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    return this.prisma.afastamento.findMany({
      where: { militarId: militar.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(matricula: string, dto: UpsertAfastamentoDto) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    const created = await this.prisma.afastamento.create({
      data: { ...dto, militarId: militar.id },
    });
    await this.militaresService.recalculateByMatricula(matricula);
    await this.logsService.createLog({
      acao: 'CREATE',
      entidade: 'AFASTAMENTO',
      entidadeId: String(created.id),
      militarId: militar.id,
      after: created,
    });
    return created;
  }

  async update(matricula: string, id: number, dto: UpsertAfastamentoDto) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    const before = await this.prisma.afastamento.findFirst({
      where: { id, militarId: militar.id },
    });
    if (!before) throw new NotFoundException('Afastamento não encontrado');
    const updated = await this.prisma.afastamento.update({
      where: { id },
      data: dto,
    });
    await this.militaresService.recalculateByMatricula(matricula);
    await this.logsService.createLog({
      acao: 'UPDATE',
      entidade: 'AFASTAMENTO',
      entidadeId: String(updated.id),
      militarId: militar.id,
      before,
      after: updated,
    });
    return updated;
  }

  async remove(matricula: string, id: number) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    const before = await this.prisma.afastamento.findFirst({
      where: { id, militarId: militar.id },
    });
    if (!before) throw new NotFoundException('Afastamento não encontrado');
    await this.prisma.afastamento.delete({ where: { id } });
    await this.militaresService.recalculateByMatricula(matricula);
    await this.logsService.createLog({
      acao: 'DELETE',
      entidade: 'AFASTAMENTO',
      entidadeId: String(id),
      militarId: militar.id,
      before,
    });
    return { success: true };
  }
}
