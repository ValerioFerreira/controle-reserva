import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';
import { LogsService } from '../logs/logs.service';
import { CreateAverbacaoDto } from './dto/create-averbacao.dto';
import { UpdateAverbacaoDto } from './dto/update-averbacao.dto';

@Injectable()
export class AverbacaoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reservaService: ReservaService,
    private readonly logsService: LogsService,
  ) {}

  private async getMilitarOuErro(matricula: string) {
    const militar = await this.prisma.militar.findUnique({ where: { matricula } });
    if (!militar) throw new NotFoundException(`Militar com matrícula ${matricula} não encontrado`);
    return militar;
  }

  private async recalcularEPersistir(militarId: number) {
    const militar = await this.prisma.militar.findUnique({
      where: { id: militarId },
      include: {
        averbacoes: true,
        afastamentos: true,
      },
    });

    if (!militar) return;

    const resultado = this.reservaService.calcularDatasReserva(
      militar,
      militar.averbacoes,
      militar.afastamentos,
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

  async findByMatricula(matricula: string) {
    const militar = await this.getMilitarOuErro(matricula);
    return this.prisma.averbacao.findMany({
      where: { militarId: militar.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(matricula: string, dto: CreateAverbacaoDto, usuarioId?: number) {
    const militar = await this.getMilitarOuErro(matricula);

    const averbacao = await this.prisma.averbacao.create({
      data: {
        militarId: militar.id,
        tipo: dto.tipo,
        dias: dto.dias,
        processoSeiMilitar: dto.processoSeiMilitar || null,
        processoSeiInss: dto.processoSeiInss || null,
        obs: dto.obs || null,
      },
    });

    await this.recalcularEPersistir(militar.id);

    await this.logsService.createLog({
      usuarioId,
      acao: 'CREATE',
      entidade: 'Averbacao',
      entidadeId: String(averbacao.id),
      militarId: militar.id,
      dadosNovos: averbacao,
    });

    return averbacao;
  }

  async update(id: number, matricula: string, dto: UpdateAverbacaoDto, usuarioId?: number) {
    const militar = await this.getMilitarOuErro(matricula);

    const anterior = await this.prisma.averbacao.findFirst({
      where: { id, militarId: militar.id },
    });

    if (!anterior) {
      throw new NotFoundException(`Averbação ${id} não encontrada para este militar`);
    }

    const atualizado = await this.prisma.averbacao.update({
      where: { id },
      data: {
        tipo: dto.tipo ?? anterior.tipo,
        dias: dto.dias ?? anterior.dias,
        processoSeiMilitar: dto.processoSeiMilitar !== undefined ? dto.processoSeiMilitar : anterior.processoSeiMilitar,
        processoSeiInss: dto.processoSeiInss !== undefined ? dto.processoSeiInss : anterior.processoSeiInss,
        obs: dto.obs !== undefined ? dto.obs : anterior.obs,
      },
    });

    await this.recalcularEPersistir(militar.id);

    await this.logsService.createLog({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'Averbacao',
      entidadeId: String(id),
      militarId: militar.id,
      dadosAntigos: anterior,
      dadosNovos: atualizado,
    });

    return atualizado;
  }

  async remove(id: number, matricula: string, usuarioId?: number) {
    const militar = await this.getMilitarOuErro(matricula);

    const averbacao = await this.prisma.averbacao.findFirst({
      where: { id, militarId: militar.id },
    });

    if (!averbacao) {
      throw new NotFoundException(`Averbação ${id} não encontrada para este militar`);
    }

    await this.prisma.averbacao.delete({ where: { id } });

    await this.recalcularEPersistir(militar.id);

    await this.logsService.createLog({
      usuarioId,
      acao: 'DELETE',
      entidade: 'Averbacao',
      entidadeId: String(id),
      militarId: militar.id,
      dadosAntigos: averbacao,
    });

    return { deleted: true };
  }
}
