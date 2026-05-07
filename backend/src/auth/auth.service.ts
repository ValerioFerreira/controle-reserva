import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

// Usuário hardcoded para uso inicial.
// Estrutura pronta para substituição por autenticação real com banco de dados.
const HARDCODED_USER = {
  id: 1,
  username: 'adm',
  password: 'adm',
  nome: 'Administrador',
  perfil: 'admin',
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto): Promise<{ access_token: string; user: { nome: string; perfil: string } }> {
    const { username, password } = dto;

    // Validação hardcoded — substituir por busca no banco quando necessário
    if (username !== HARDCODED_USER.username || password !== HARDCODED_USER.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: HARDCODED_USER.id,
      username: HARDCODED_USER.username,
      nome: HARDCODED_USER.nome,
      perfil: HARDCODED_USER.perfil,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        nome: HARDCODED_USER.nome,
        perfil: HARDCODED_USER.perfil,
      },
    };
  }
}
