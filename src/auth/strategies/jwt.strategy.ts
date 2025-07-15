import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../service/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', process.env.JWT_SECRET_KEY),
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub, payload.tokenId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return { ...user, tokenId: payload.tokenId };
  }
}
