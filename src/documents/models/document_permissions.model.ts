// src/documents/entities/document.entity.ts
import { Table, Column, Model, DataType } from 'sequelize-typescript';


@Table({ 
    tableName: 'document_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
})
export class DocumentPermission extends Model<DocumentPermission> {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true
    })
    declare id: number;
  
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    documentId: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    userId: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
    })
    canRead: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    canWrite: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    canDelete: boolean;

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    grantedById: number;

    @Column({
        type: DataType.DATE,
        field: 'created_at'
    })
    created_at: Date

    @Column({
        type: DataType.DATE,
        field: 'updated_at'
    })
    updated_at: Date
}
