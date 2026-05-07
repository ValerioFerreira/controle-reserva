import { Injectable, NotFoundException } from '@nestjs/common';
import { LogsService } from '../logs/logs.service';
import { MilitaresService } from '../militares/militares.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertAverbacaoDto } from './dto/upsert-averbacao.dto';

@Injectable()
export class AverbacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly militaresService: MilitaresService,
    private readonly logsService: LogsService,
  ) {}

  async list(matricula: string) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    return this.prisma.averbacao.findMany({
      where: { militarId: militar.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(matricula: string, dto: UpsertAverbacaoDto) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    const created = await this.prisma.averbacao.create({
      data: { ...dto, militarId: militar.id },
    });
    await this.militaresService.recalculateByMatricula(matricula);
    await this.logsService.createLog({
      acao: 'CREATE',
      entidade: 'AVERBACAO',
      entidadeId: String(created.id),
      militarId: militar.id,
      after: created,
    });
    return created;
  }

  async update(matricula: string, id: number, dto: UpsertAverbacaoDto) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException('Militar não encontrado');
    const before = await this.prisma.averbacao.findFirst({
      where: { id, militarId: militar.id },
    });
    if (!before) throw new NotFoundException('Averbação não encontrada');
    const updated = await this.prisma.averbacao.update({
      where: { id },
      data: dto,
    });
    await this.militaresService.recalculateByMatricula(matricula);
    await this.logsService.createLog({
      acao: 'UPDATE',
      entidade: 'AVERBACAO',
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
    const before = await this.prisma.averbacao.findFirst({
      where: { id, militarId: militar.id },
    });
    if (!before) throw new NotFoundException('Averbação não encontrada');
    await this.prisma.averbacao.delete({ where: { id } });
    await this.militaresService.recalculateByMatricula(matricula);
    await this.logsService.createLog({
      acao: 'DELETE',
      entidade: 'AVERBACAO',
      entidadeId: String(id),
      militarId: militar.id,
      before,
    });
    return { success: true };
  }
}
