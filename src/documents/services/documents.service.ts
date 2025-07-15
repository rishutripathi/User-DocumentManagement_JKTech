import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DocumentRepository } from '../repository/documents.repository';
import { User } from 'src/user/models/user.model';
import { Document } from '../models/document.model';
import { CreateDocumentDto, GetDocumentsFilterDto, UpdateDocumentDto } from '../DTO/documents.dto';
import * as fs from 'fs';
import { Status } from 'src/common/type/status.type';
import { CreationAttributes, Op } from 'sequelize';
import { DocumentPermission } from '../models/document_permissions.model';
import { DocumentPermissionRepository } from '../repository/document_permissions.repository';
import { DocumentStatus } from 'src/common/enums/database.enums';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly documentPRepo: DocumentPermissionRepository
  ) {}

  async getAllDocuments() {
    const documents = await this.documentRepo.find();
    return documents;
  }
  
  async getAllDocuments_paginated(filters: GetDocumentsFilterDto) {
    const { page, limit } = filters;
    const offset = (page - 1) * limit;

    // Simple query
    const documentList = await this.documentRepo.find({offset, limit, order: [['created_at', 'DESC']]});

    const totalCount = documentList.length;

    return {
      documents: documentList,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit),
      },
    };
  }

  async getDocumentById(user: User, id: number): Promise<Document | { uploadedBy: { id: number, username: string } }> {
    const document = await this.documentRepo.findById(id);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check permissions
    if (user.role !== 'admin' && document.uploadedById !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return { ...document, uploadedBy: { id: user?.id, username: user?.username } };
  }

  async uploadDocument(user: User, file: Express.Multer.File, createDocumentDto: CreateDocumentDto) {
    const { title, description, tags } = createDocumentDto;

    const newDocument: Partial<Document> = {
      title,
      description,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      uploadedById: user.id,
      status: DocumentStatus.PENDING
    };

    const document = await this.documentRepo.create(newDocument as any);

    return {
      message: 'Document uploaded successfully',
      document
    };
  }

  async uploadBulkDocuments(documents: CreationAttributes<Document>[]) {
    await this.documentRepo.createMany(documents);
  }

  async updateDocument(user: User, id: number, updateDocumentDto: UpdateDocumentDto) {
    const document = await this.getDocumentById(user, id);

    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (updateDocumentDto.title) updateData.title = updateDocumentDto.title;
    if (updateDocumentDto.description) updateData.description = updateDocumentDto.description;
    if (updateDocumentDto.tags) updateData.tags = Array.isArray(updateDocumentDto.tags) ? updateDocumentDto.tags.join(',') : updateDocumentDto.tags;

    await this.documentRepo.update({ id }, updateData);

    return {
      message: 'Document updated successfully'
    };
  }

  async deleteDocument(user: User, id: number): Promise<{ message: string }> {
    const result = await this.getDocumentById(user, id);
    const document = result as Document & { uploadedBy: { id: number; username: string } };

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await this.documentRepo.deleteById(document.id);
    return {
      message: 'Document deleted successfully'
    };
  }

  async deleteAllDocuments(): Promise<{ message: string }> {
    await this.documentRepo.deleteAll();
    return {
      message: "All documents deleted successfully"
    };
  }

  async getUserDocuments(userId: number, filters: { page: number; limit: number }) {
    const { page, limit } = filters;
    const offset = (page - 1) * limit;
    const userDocuments = await this.documentRepo.find({ where: { uploadedById: userId }, limit, offset });
    const totalCount = userDocuments.length;

    return {
      documents: userDocuments,
      pagination: {
        page,
        limit,
        total: totalCount[0].count,
        pages: Math.ceil(totalCount[0].count / limit)
      },
    };
  }

  async updateDocumentStatus(documentId: number, status: Status): Promise<{ message: string }> {
    await this.documentRepo.update({ status }, { id: documentId } );
    return { message: 'Document updated successfully' };
  }

  private async checkDocumentPermission(userId: number, documentId: number): Promise<boolean> {
    // Simplified permission check
    const document = await this.documentRepo.findById(documentId);

    return document?.uploadedById === userId;
  }

  async addDocPermissions(user: User, id: number, payload: CreationAttributes<DocumentPermission>) {
    const isAllowed = await this.checkDocumentPermission(user.id, id);
    if(isAllowed) {
      const query = { 
        userId: user.id,
        documentId: id 
      };
      await this.documentPRepo.update(query, payload);
    }
  }
  
  async createDocPermissions(payload: CreationAttributes<DocumentPermission>[]) {
    await this.documentPRepo.createMany(payload);
  }
}
