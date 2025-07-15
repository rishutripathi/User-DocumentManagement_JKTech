import { BaseRepository } from "src/common/repository/base.repository";
import { Document } from "../models/document.model";
import { InjectModel } from "@nestjs/sequelize";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DocumentRepository extends BaseRepository<Document> {
    constructor(
        @InjectModel(Document) documentModel: typeof Document
    ) {
        super(documentModel);
    }
}
