import { IsOptional, IsString, IsDateString, IsIn, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryMilitarDto {
  @IsOptional()
  @IsString()
  matricula?: string;

  @IsOptional()
  @IsString()
  nome?: string;

  @IsOptional()
  @IsString()
  postoGrad?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @IsIn(['vermelho', 'amarelo'])
  alerta?: 'vermelho' | 'amarelo';

  @IsOptional()
  @IsString()
  abono?: string;

  @IsOptional()
  @IsString()
  pcnh?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}
