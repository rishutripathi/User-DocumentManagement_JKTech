import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import { IUserCreator } from "../interfaces/user.interfaces";
import { CreateUserDto } from "../DTO/user.dtos";
import { Op } from "sequelize";
import { UserRepository } from "../repository/user.repository";

@Injectable()
export class UserCreateService implements IUserCreator {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(createUserDto: CreateUserDto) {
    const { username, email, password } = createUserDto;

    const existing = await this.userRepository.findOne({
      where: { [Op.or]: [{ email }, { username }] },
    });
    if (existing) {
      throw new ConflictException('User with this email or username already exists');
    }

    const saltRounds = 12;
    const hashed = await bcrypt.hash(password, saltRounds);
    createUserDto.password = hashed;
    await this.userRepository.create({ ...createUserDto } as any);
    return {
      createUserDto,
      message: 'User created successfully' 
    };
  }
}
