import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';


export class CreateDocumentDto {
  @ApiProperty({ example: 'Important Document' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'This document contains important information', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['important', 'work'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] | string;
}

export class UpdateDocumentDto {
  @ApiProperty({ example: 'Updated Document Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['updated', 'tags'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class GetDocumentsFilterDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['pending', 'processing', 'completed', 'failed'])
  status?: string;
}

export class DocumentPermissionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  documentId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  canRead?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  canWrite?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  canDelete?: boolean;

  @ApiProperty({ example: 1 })
  @IsNumber()
  grantedById: number;
}
