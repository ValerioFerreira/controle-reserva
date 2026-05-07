import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(data: LoginDto) {
    if (data.username !== 'adm' || data.password !== 'adm') {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: 'hardcoded-admin',
      nome: 'Administrador',
      perfil: 'admin',
      cpf: '00000000000',
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      accessToken: token,
      user: {
        nome: payload.nome,
        perfil: payload.perfil,
      },
    };
  }
}
