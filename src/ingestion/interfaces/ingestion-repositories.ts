import { CreateIngestionJobDto, TriggerIngestionDto } from "../DTO/ingestion.dto";
import { IngestionJob } from "../models/ingestion_jobs.model";

export interface IIngestionReadRepo {
  findAll(opts: { offset: number; limit: number }): Promise<IngestionJob[]>;
  findById(id: number): Promise<IngestionJob | null>;
  findByUser(userId: number, opts: { offset: number; limit: number }): Promise<[IngestionJob[], number]>;
  findAllWithCount(opts: { offset: number; limit: number }): Promise<[IngestionJob[], number]>;
}

export interface IIngestionWriteRepo {
  findById(id: number): Promise<IngestionJob>;
  create(data: CreateIngestionJobDto): Promise<IngestionJob>;
  createMany(payload: CreateIngestionJobDto[]): Promise<IngestionJob[]>;
  update(id: number, changes: Partial<IngestionJob>): Promise<void>;
  delete(id: number): Promise<void>;
  deleteAll(): Promise<void>;
}
