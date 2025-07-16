import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRoleEnum } from '../enum/user.enum';
import { UserRole } from 'src/common/enums/database.enums';
import { Status } from 'src/common/type/status.type';

export class CreateUserDto {
  @ApiProperty({ example: 'rishu' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'rishu@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @ApiProperty({ example: 'Rishu' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Tripathi' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ enum: UserRole, required: false, default: UserRoleEnum.VIEWER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRoleEnum | null;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'rtrp', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @ApiProperty({ example: 'rishu@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Rishu', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ example: 'Tripathi', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;
  
  @ApiProperty({ example: '%$SecurePassword$%', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsEnum(['queued', 'processing', 'completed', 'failed', 'cancelled'])
  status?: Status;

  @ApiProperty({ example: 50.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;
    errorMessage?: any;
    resultData?: any;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRoleEnum })
  @IsEnum(UserRoleEnum)
  role: UserRoleEnum;
}

export class GetUsersFilterDto {
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
  @IsEnum(UserRoleEnum)
  role?: string;
}
