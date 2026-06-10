import { IsString, IsInt, IsOptional, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const TIPOS_VALIDOS = ['FÉRIAS NÃO GOZADAS', 'LTIP'];

export class UpdateAfastamentoDto {
  @IsOptional()
  @IsString()
  @IsIn(TIPOS_VALIDOS)
  tipo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (value !== undefined && value !== null ? parseInt(value, 10) : value))
  dias?: number;

  @IsOptional()
  @IsString()
  processoSeiMilitar?: string;

  @IsOptional()
  @IsString()
  obs?: string;
}
