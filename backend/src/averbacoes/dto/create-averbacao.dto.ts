import { IsString, IsInt, IsNotEmpty, IsOptional, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const TIPOS_VALIDOS = ['INSS', 'FFAA', 'PMPE', 'PM DE OUTROS ESTADOS', 'BM DE OUTROS ESTADOS'];

export class CreateAverbacaoDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(TIPOS_VALIDOS)
  tipo: string;

  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  dias: number;

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
