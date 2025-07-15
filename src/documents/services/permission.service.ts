import { Injectable } from '@nestjs/common';
import { User } from 'src/user/models/user.model';
import { IDocumentRepository } from '../interfaces/document-repository.interface';

@Injectable()
export class PermissionService {
  constructor(
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async canView(user: User, documentId: number): Promise<boolean> {
    if (user.role === 'admin') return true;
    const doc = await this.documentRepo.findById(documentId);
    return doc?.uploadedById === user.id;
  }

  async canEdit(user: User, documentId: number): Promise<boolean> {
    // same as view for now, but can diverge later
    return this.canView(user, documentId);
  }
}
