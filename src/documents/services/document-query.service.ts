import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IDocumentRepository } from '../interfaces/document-repository.interface';
import { PermissionService } from './permission.service';
import { GetDocumentsFilterDto } from '../DTO/documents.dto';
import { Document } from '../models/document.model';
import { User } from 'src/user/models/user.model';

@Injectable()
export class DocumentQueryService {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly permissionService: PermissionService,
  ) {}

  async getAll(): Promise<Document[]> {
    return this.documentRepo.find({ order: [['created_at', 'DESC']] });
  }

  async getAllPaginated(filters: GetDocumentsFilterDto) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const total = await this.documentRepo.count();
    const documents = await this.documentRepo.find({
      offset,
      limit,
      order: [['created_at', 'DESC']],
    });

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(user: User, id: number) {
    const doc = await this.documentRepo.findById(id);
    if (!doc) throw new NotFoundException('Document not found');
    if (!(await this.permissionService.canView(user, id))) {
      throw new ForbiddenException('Access denied');
    }
    return {
      ...doc.get(), // or plain to JSON
      uploadedBy: { id: user.id, username: user.username },
    };
  }

  async getUserDocuments(userId: number, filters: GetDocumentsFilterDto) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const total = await this.documentRepo.count({ uploadedById: userId });
    const documents = await this.documentRepo.find({
      where: { uploadedById: userId },
      offset,
      limit,
      order: [['created_at', 'DESC']],
    });

    return {
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
