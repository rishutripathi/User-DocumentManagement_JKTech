import { Column, DataType, ForeignKey, Table, Model } from 'sequelize-typescript';
import { Document } from 'src/documents/models/document.model';
import { User } from 'src/user/models/user.model';
import { IngestionStatus } from '../enum/ingestion.enum';

@Table({
  tableName: 'ingestion_jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})

export class IngestionJob extends Model<IngestionJob, IngestionJob> {
  toRetryUpdate(): Partial<IngestionJob> {
    throw new Error("Method not implemented.");
  }
  toCancelUpdate(): Partial<IngestionJob> {
    throw new Error("Method not implemented.");
  }
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number

  @ForeignKey(() => Document)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "document_id",
  })
  documentId: number

  @Column({
    type: DataType.ENUM(...Object.values(IngestionStatus)),
    allowNull: false,
    defaultValue: IngestionStatus.QUEUED
  })
  status: IngestionStatus

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  progress: number

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "started_at",
  })
  startedAt: Date

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: "completed_at",
  })
  completedAt: Date

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "error_message",
  })
  errorMessage: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: "result_data",
  })
  resultData: string

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "triggered_by_id",
  })
  triggeredById: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  priority: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: "retry_count",
  })
  retryCount: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 3,
    field: "max_retries",
  })
  maxRetries: number

  @Column({
    type: DataType.DATE,
    field: "created_at",
  })
  created_at: Date

  @Column({
    type: DataType.DATE,
    field: "updated_at",
  })
  updated_at: Date
}
