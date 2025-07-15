import { UserRoleEnum } from "src/user/enum/user.enum";

export interface User {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRoleEnum;
  isActive: boolean;
  lastLoginAt: Date;
};
