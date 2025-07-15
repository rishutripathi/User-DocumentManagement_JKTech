import { User } from "src/user/models/user.model";

export interface IPasswordService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
}

export interface ITokenService {
  generateToken(user: User): string;
  generateTokenId(): string;
}

export interface ISessionService {
  createSession(tokenId: string): Promise<void>;
  invalidateSession(tokenId: string): Promise<void>;
}