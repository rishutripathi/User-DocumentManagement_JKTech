import { Injectable } from '@nestjs/common';
import { ISessionService } from '../interfaces/auth.interfaces';



@Injectable()
export class SessionService implements ISessionService {
  private sessions: Map<string, { expiresAt: Date }> = new Map();

  async createSession(tokenId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour session
    this.sessions.set(tokenId, { expiresAt });
  }

  async invalidateSession(tokenId: string): Promise<void> {
    this.sessions.delete(tokenId);
  }
}
