import { Injectable, NotFoundException } from "@nestjs/common";
import { IUserSearcher } from "../interfaces/user.interfaces";
import { Op } from "sequelize";
import { GetUsersFilterDto } from "../DTO/user.dtos";
import { UserRepository } from "../repository/user.repository";


@Injectable()
export class UserSearchService implements IUserSearcher {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers() {
    const users = await this.userRepository.find();
    return users.map((u) => {
      const { password, ...rest } = u.get({ plain: true });
      return rest;
    });
  }

  async getAllUsers_Paginated(filters: GetUsersFilterDto) {
    const { page, limit, search, role } = filters;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        JSON.parse(search),
      ];
    }
    if (role) where.role = role;

    const { rows: users, count: totalCount } = await this.userRepository.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const usersWithoutPasswords = users.map((u) => {
      const { password, ...rest } = u.get({ plain: true });
      return rest;
    });

    return {
      users: usersWithoutPasswords,
      pagination: { page, limit, total: totalCount, totalPages: Math.ceil(totalCount / limit) },
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    const { password, ...rest } = user.get({ plain: true });
    return rest;
  }

  async getUserAndPassById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async getUserByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }
}