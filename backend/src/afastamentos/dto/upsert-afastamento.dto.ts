import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoAfastamento } from '../../reserva/reserva.types';

export class UpsertAfastamentoDto {
  @IsEnum(TipoAfastamento)
  tipo!: TipoAfastamento;

  @IsInt()
  @Min(1)
  dias!: number;

  @IsOptional()
  @IsString()
  processoSeiMilitar?: string;

  @IsOptional()
  @IsString()
  obs?: string;
}
