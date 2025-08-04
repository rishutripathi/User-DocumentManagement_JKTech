import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IPasswordService } from '../interfaces/auth.interfaces';


@Injectable()
export class PasswordService implements IPasswordService {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    console.log("is pass matched:::::::", await bcrypt.compare(password, hash));
    return await bcrypt.compare(password, hash);
  }
}
