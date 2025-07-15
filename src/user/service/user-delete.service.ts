import { Injectable, NotFoundException } from "@nestjs/common";
import { IUserDeleter } from "../interfaces/user.interfaces";
import { UserRepository } from "../repository/user.repository";


@Injectable()
export class UserDeleteService implements IUserDeleter {
  constructor(private readonly userRepository: UserRepository) {}

  async deleteUser(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.destroy({ id });
    return { message: 'User deleted successfully' };
  }

  async deleteAllUsers() {
    await this.userRepository.deleteAll();
    return { message: 'All users deleted successfully' };
  }
}
