import { PartialType } from '@nestjs/mapped-types';
import { CreateAverbacaoDto } from './create-averbacao.dto';

export class UpdateAverbacaoDto extends PartialType(CreateAverbacaoDto) {}
