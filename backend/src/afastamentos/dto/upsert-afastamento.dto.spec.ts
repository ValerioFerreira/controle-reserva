import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpsertAfastamentoDto } from './upsert-afastamento.dto';

describe('UpsertAfastamentoDto', () => {
  it('aceita tipo válido', async () => {
    const dto = plainToInstance(UpsertAfastamentoDto, {
      tipo: 'LTIP',
      dias: 5,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita tipo inválido', async () => {
    const dto = plainToInstance(UpsertAfastamentoDto, {
      tipo: 'FERIAS',
      dias: 5,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
