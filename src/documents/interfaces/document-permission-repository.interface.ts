import { WhereOptions, CreationAttributes } from 'sequelize';
import { DocumentPermission } from '../models/document_permissions.model';

export interface IDocumentPermissionRepository {
  update(where: WhereOptions, payload: Partial<DocumentPermission>): Promise<[number, DocumentPermission[]]>;
  createMany(payload: CreationAttributes<DocumentPermission>[]): Promise<void>;
}
