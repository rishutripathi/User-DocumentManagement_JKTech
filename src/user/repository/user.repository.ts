import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { BaseRepository } from 'src/common/repository/base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(User) userModel: typeof User,
  ) {
    super(userModel);
  }
}
