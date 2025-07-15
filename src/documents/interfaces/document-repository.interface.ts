import { FindOptions, WhereOptions, CreationAttributes } from 'sequelize';
import { Document } from '../models/document.model';

export interface IDocumentRepository {
  find(options?: FindOptions): Promise<Document[]>;
  findById(id: number): Promise<Document | null>;
  create(data: Partial<Document>): Promise<Document>;
  createMany(data: CreationAttributes<Document>[]): Promise<void>;
  update(data: Partial<Document>, where: WhereOptions): Promise<[number, Document[]]>;
  deleteById(id: number): Promise<void>;
  deleteAll(): Promise<void>;
  count(where?: WhereOptions): Promise<number>;
}
