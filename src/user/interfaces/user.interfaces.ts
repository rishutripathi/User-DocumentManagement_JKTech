import { CreateUserDto, GetUsersFilterDto, UpdateUserDto, UpdateUserRoleDto } from "../DTO/user.dtos";
import { User } from "../models/user.model";


export interface IUserCreator {
  createUser(createUserDto: CreateUserDto): Promise<any>;
  createBulkUsers(createUsersDto: CreateUserDto[]): Promise<any>;
}

export interface IUserUpdater {
  updateUser(id: number, dto: UpdateUserDto): Promise<any>;
  updateUserRole(id: number, dto: UpdateUserRoleDto): Promise<any>;
  toggleUserStatus(id: number): Promise<any>;
}

export interface IUserDeleter {
  deleteUser(id: number): Promise<any>;
  deleteAllUsers(): Promise<any>;
}

export interface IUserSearcher {
  getAllUsers(): Promise<any>;
  getAllUsers_Paginated(filters: GetUsersFilterDto): Promise<any>;
  getUserById(id: number): Promise<any>;
  getUserAndPassById(id: number): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
}
