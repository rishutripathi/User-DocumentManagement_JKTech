import { Inject, Injectable } from "@nestjs/common";
import { IIngestionReadRepo } from "../interfaces/ingestion-repositories";


@Injectable()
export class IngestionStatsService {
  constructor(@Inject('IngestionReadRepo') private readonly repo: IIngestionReadRepo) {}

  async getStats() {
    const all = await this.repo.findAll({ offset: 0, limit: 1000000 });
    return all?.length;
  }
}
