import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { DocumentStatus } from '../../common/enums/database.enums';
import { User } from '../../user/models/user.model';


@Table({ 
    tableName: 'documents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
export class Document extends Model<Document> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    field: 'file_name',
  })
  fileName: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
    field: 'file_path',
  })
  filePath: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'file_size',
  })
  fileSize: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    field: 'mime_type',
  })
  mimeType: string;

  @Column({
    type: DataType.ENUM(...Object.values(DocumentStatus)),
    allowNull: false,
    defaultValue: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'uploaded_by_id',
  })
  uploadedById: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  tags: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  metadata: string;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  created_at: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  updated_at: Date;

  static
}

