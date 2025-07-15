// ingestion/DTO/webhook.dto.ts

import { IsNumber, IsOptional, IsEnum, IsString, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from 'src/common/type/status.type';

export class WebhookDto {
  @ApiProperty({
    description: 'The ID of the ingestion job to update',
    example: 42,
  })
  @IsNumber()
  jobId: number;

  @ApiProperty({
    description: 'New status of the ingestion job',
    enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
    example: 'processing',
  })
  @IsEnum(['queued', 'processing', 'completed', 'failed', 'cancelled'])
  status: Status;

  @ApiProperty({
    description: 'Progress percentage (0–100)',
    example: 55.5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiProperty({
    description: 'Error message, if status === "failed"',
    example: 'OCR engine timeout',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: 'Result payload (arbitrary JSON)',
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  results?: any;
}
