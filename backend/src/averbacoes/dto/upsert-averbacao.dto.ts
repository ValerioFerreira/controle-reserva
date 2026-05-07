import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoAverbacao } from '../../reserva/reserva.types';

export class UpsertAverbacaoDto {
  @IsEnum(TipoAverbacao)
  tipo!: TipoAverbacao;

  @IsInt()
  @Min(1)
  dias!: number;

  @IsOptional()
  @IsString()
  processoSeiMilitar?: string;

  @IsOptional()
  @IsString()
  processoSeiInss?: string;

  @IsOptional()
  @IsString()
  obs?: string;
}
