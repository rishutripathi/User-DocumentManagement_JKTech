import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { StorageService } from './storage.service';
import { User } from 'src/user/models/user.model';
import { DocumentStatus } from 'src/common/enums/database.enums';
import { CreateDocumentDto, UpdateDocumentDto } from '../DTO/documents.dto';
import { DocumentRepository } from '../repository/documents.repository';


@Injectable()
export class DocumentCommandService {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly permissionService: PermissionService,
    private readonly storageService: StorageService,
  ) {}

  async create(user: User, file: Express.Multer.File, dto: CreateDocumentDto) {
    const doc = await this.documentRepo.create({
      ...dto,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      tags:  '',
      uploadedById: user.id,
      status: DocumentStatus.PENDING,
    } as any);
    return { message: 'Document uploaded successfully', document: doc };
  }

  async update(user: User, id: number, dto: UpdateDocumentDto) {
    if (!(await this.permissionService.canEdit(user, id))) {
      throw new ForbiddenException('Access denied');
    }
    const [count] = await this.documentRepo.update(
      {
        ...dto,
        tags: dto.tags?.join(','),
        updatedAt: new Date(),
      },
      { id },
    );
    if (count === 0) throw new NotFoundException('Document not found');
    return { message: 'Document updated successfully' };
  }

  async delete(user: User, id: number) {
    // will throw if not found or not allowed
    const can = await this.permissionService.canView(user, id);
    if (!can) throw new ForbiddenException('Access denied');

    const doc = await this.documentRepo.findById(id);
    if (!doc) throw new NotFoundException('Document not found');

    this.storageService.delete(doc.filePath);
    await this.documentRepo.deleteById(id);
    return { message: 'Document deleted successfully' };
  }

  async deleteAll() {
    await this.documentRepo.deleteAll();
    return { message: 'All documents deleted successfully' };
  }

  async updateStatus(id: number, status: DocumentStatus) {
    const [count] = await this.documentRepo.update({ status }, { id });
    if (count === 0) throw new NotFoundException('Document not found');
    return { message: 'Document status updated successfully' };
  }
}
