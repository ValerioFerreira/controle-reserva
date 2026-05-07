import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservaService } from '../reserva/reserva.service';
import { LogsService } from '../logs/logs.service';
import { CreateAfastamentoDto } from './dto/create-afastamento.dto';
import { UpdateAfastamentoDto } from './dto/update-afastamento.dto';

@Injectable()
export class AfastamentosService {
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
    return this.prisma.afastamento.findMany({
      where: { militarId: militar.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(matricula: string, dto: CreateAfastamentoDto, usuarioId?: number) {
    const militar = await this.getMilitarOuErro(matricula);

    const afastamento = await this.prisma.afastamento.create({
      data: {
        militarId: militar.id,
        tipo: dto.tipo,
        dias: dto.dias,
        processoSeiMilitar: dto.processoSeiMilitar || null,
        obs: dto.obs || null,
      },
    });

    await this.recalcularEPersistir(militar.id);

    await this.logsService.createLog({
      usuarioId,
      acao: 'CREATE',
      entidade: 'Afastamento',
      entidadeId: String(afastamento.id),
      militarId: militar.id,
      dadosNovos: afastamento,
    });

    return afastamento;
  }

  async update(id: number, matricula: string, dto: UpdateAfastamentoDto, usuarioId?: number) {
    const militar = await this.getMilitarOuErro(matricula);

    const anterior = await this.prisma.afastamento.findFirst({
      where: { id, militarId: militar.id },
    });

    if (!anterior) {
      throw new NotFoundException(`Afastamento ${id} não encontrado para este militar`);
    }

    const atualizado = await this.prisma.afastamento.update({
      where: { id },
      data: {
        tipo: dto.tipo ?? anterior.tipo,
        dias: dto.dias ?? anterior.dias,
        processoSeiMilitar: dto.processoSeiMilitar !== undefined ? dto.processoSeiMilitar : anterior.processoSeiMilitar,
        obs: dto.obs !== undefined ? dto.obs : anterior.obs,
      },
    });

    await this.recalcularEPersistir(militar.id);

    await this.logsService.createLog({
      usuarioId,
      acao: 'UPDATE',
      entidade: 'Afastamento',
      entidadeId: String(id),
      militarId: militar.id,
      dadosAntigos: anterior,
      dadosNovos: atualizado,
    });

    return atualizado;
  }

  async remove(id: number, matricula: string, usuarioId?: number) {
    const militar = await this.getMilitarOuErro(matricula);

    const afastamento = await this.prisma.afastamento.findFirst({
      where: { id, militarId: militar.id },
    });

    if (!afastamento) {
      throw new NotFoundException(`Afastamento ${id} não encontrado para este militar`);
    }

    await this.prisma.afastamento.delete({ where: { id } });

    await this.recalcularEPersistir(militar.id);

    await this.logsService.createLog({
      usuarioId,
      acao: 'DELETE',
      entidade: 'Afastamento',
      entidadeId: String(id),
      militarId: militar.id,
      dadosAntigos: afastamento,
    });

    return { deleted: true };
  }
}
