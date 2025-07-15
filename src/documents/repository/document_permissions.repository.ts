import { BaseRepository } from "src/common/repository/base.repository";
import { DocumentPermission } from "../models/document_permissions.model";
import { InjectModel } from "@nestjs/sequelize";

export class DocumentPermissionRepository extends BaseRepository<DocumentPermission> {
    constructor(
        @InjectModel(DocumentPermission) documentPermissionModel: typeof DocumentPermission
        ) {
            super(documentPermissionModel);
        }
}
