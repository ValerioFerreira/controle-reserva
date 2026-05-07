import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertAverbacaoDto } from './upsert-averbacao.dto';

describe('UpsertAverbacaoDto', () => {
  it('aceita tipo válido', async () => {
    const dto = plainToInstance(UpsertAverbacaoDto, {
      tipo: 'INSS',
      dias: 10,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita tipo inválido', async () => {
    const dto = plainToInstance(UpsertAverbacaoDto, {
      tipo: 'INVALIDO',
      dias: 10,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
