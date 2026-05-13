import { IsBoolean, IsOptional, IsDateString } from 'class-validator';

export class UpdateAbonoDto {
  @IsBoolean()
  abonoPermanencia: boolean;

  @IsOptional()
  @IsDateString()
  dataInicioAbono?: string;
}
