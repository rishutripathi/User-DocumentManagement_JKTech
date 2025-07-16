import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserRepository } from './repository/user.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { UserCreateService } from './service/user-create.service';
import { UserDeleteService } from './service/user-delete.service';
import { UserSearchService } from './service/user-search.service';
import { UserUpdateService } from './service/user-update.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User])
  ],
  controllers: [UserController],
  providers: [
    UserRepository,
    UserCreateService,
    UserDeleteService,
    UserSearchService,
    UserUpdateService
  ],
  exports: [
    UserRepository,
    UserCreateService,
    UserDeleteService,
    UserSearchService,
    UserUpdateService
  ]
})
export class UserModule {}
