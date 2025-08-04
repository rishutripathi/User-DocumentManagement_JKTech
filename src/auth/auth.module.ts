import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConfig } from '../config/jwt.config';
import { UserModule } from 'src/user/user.module';
import { PasswordService } from './service/password.service';
import { SessionService } from './service/session.service';
import { TokenService } from './service/token.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync(jwtConfig),
    UserModule
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AuthService,
    PasswordService,
    SessionService,
    TokenService
  ],
  exports: [AuthService]
})
export class AuthModule {}
