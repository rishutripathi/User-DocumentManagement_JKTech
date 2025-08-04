import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { ITokenService } from '../interfaces/auth.interfaces';
import { User } from 'src/user/models/user.model';


@Injectable()
export class TokenService implements ITokenService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenId: this.generateTokenId(),
    };
    return this.jwtService.signAsync(payload);
  }

  generateTokenId(): string {
    return uuidv4();
  }
}