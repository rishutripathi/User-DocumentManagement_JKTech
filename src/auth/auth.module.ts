import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConfig } from '../config/jwt.config';
import { UserModule } from 'src/user/user.module';
import { UserRepository } from 'src/user/repository/user.repository';
import { PasswordService } from './service/password.service';
import { SessionService } from './service/session.service';
import { TokenService } from './service/token.service';
import { UserSearchService } from 'src/user/service/user-search.service';
import { UserCreateService } from 'src/user/service/user-create.service';
import { UserUpdateService } from 'src/user/service/user-update.service';

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
    TokenService,
    UserSearchService,
    UserCreateService,
    UserUpdateService
  ],
  exports: [AuthService]
})
export class AuthModule {}
