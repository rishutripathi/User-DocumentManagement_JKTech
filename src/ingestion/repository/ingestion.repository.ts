import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { BaseRepository } from "src/common/repository/base.repository";
import { IngestionJob } from "../models/ingestion_jobs.model";


@Injectable()
export class IngestionRepository extends BaseRepository<IngestionJob> {
    constructor(
        @InjectModel(IngestionJob) ingestionJobsModel: typeof IngestionJob
    ) {
        super(ingestionJobsModel);
    }
}
