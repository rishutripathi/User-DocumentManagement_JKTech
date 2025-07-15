import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { IUserUpdater } from "../interfaces/user.interfaces";
import { UpdateUserDto, UpdateUserRoleDto } from "../DTO/user.dtos";
import { Op } from "sequelize";
import { UserRepository } from "../repository/user.repository";


@Injectable()
export class UserUpdateService implements IUserUpdater {
  constructor(private readonly userRepository: UserRepository) {}

  async updateUser(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    if ((dto.email && dto.email !== user.email) || (dto.username && dto.username !== user.username)) {
      const conflicts = await this.userRepository.findOne({
        where: {
          [Op.or]: [
            { username: { [Op.iLike]: `%${dto.username}%` } },
            { email: { [Op.iLike]: `%${dto.email}%` } },
          ].filter(Boolean),
          id: { [Op.ne]: id },
        },
      });
      if (conflicts) throw new ConflictException('Email or username already in use');
    }

    await this.userRepository.update({ id }, { ...dto, updatedAt: new Date() });
    const updatedUser = await this.userRepository.findById(id);
    const { password, ...rest } = updatedUser!.get({ plain: true });
    return { message: 'User updated successfully', user: rest };
  }

  async updateUserRole(id: number, dto: UpdateUserRoleDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.update({ id }, { role: dto.role as any, updatedAt: new Date() });
    const updatedUser = await this.userRepository.findById(id);
    const { password, ...rest } = updatedUser!.get({ plain: true });
    return { message: 'User role updated successfully', user: rest };
  }

  async toggleUserStatus(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    const isActive = !user.isActive;
    await this.userRepository.update({ id }, { isActive, updatedAt: new Date() });
    const updatedUser = await this.userRepository.findById(id);
    const { password, ...rest } = updatedUser!.get({ plain: true });
    return { message: `User ${isActive ? 'activated' : 'deactivated'} successfully`, user: rest };
  }
}