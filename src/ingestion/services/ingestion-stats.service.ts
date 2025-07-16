import { Injectable } from "@nestjs/common";
import { IngestionRepository } from "../repository/ingestion.repository";


@Injectable()
export class IngestionStatsService {
  constructor(private readonly ingestionRepo: IngestionRepository) {}

  async getStats() {
    const all = await this.ingestionRepo.find();
    return all?.length;
  }
}
