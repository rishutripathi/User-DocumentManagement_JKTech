import { Injectable } from '@nestjs/common';
import { User } from 'src/user/models/user.model';
import { DocumentRepository } from '../repository/documents.repository';

@Injectable()
export class PermissionService {
  constructor(
    private readonly documentRepo: DocumentRepository,
  ) {}

  async canView(user: User, documentId: number): Promise<boolean> {
    if (user.role === 'admin') return true;
    const doc = await this.documentRepo.findById(documentId);
    return doc?.uploadedById === user.id;
  }

  async canEdit(user: User, documentId: number): Promise<boolean> {
    return this.canView(user, documentId);
  }
}
