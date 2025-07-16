import { IsNumber, IsOptional, IsEnum, IsString, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Status } from 'src/common/type/status.type';
import { IngestionStatus } from '../enum/ingestion.enum';


export class TriggerIngestionDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  documentId: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxRetries?: number;
}

export class UpdateIngestionJobDto {
  @ApiProperty({ example: 'processing', enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'], required: false })
  @IsOptional()
  @IsEnum(['queued', 'processing', 'completed', 'failed', 'cancelled'])
  status?: Status;

  @ApiProperty({ example: 50.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiProperty({ example: 'Processing error occurred', required: false })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiProperty({ example: { extractedText: 'Sample text', entities: [] }, required: false })
  @IsOptional()
  @IsObject()
  resultData?: any;
}

export class GetIngestionJobsFilterDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @IsEnum(['queued', 'processing', 'completed', 'failed', 'cancelled', 'pending'])
  status?: IngestionStatus | 'pending';
}

export class CreateIngestionJobDto {
  documentId:   number;
  status:       IngestionStatus;
  progress:     number;
  triggeredById: number;
  priority:     number;
  retryCount:   number;
  maxRetries:   number;
}