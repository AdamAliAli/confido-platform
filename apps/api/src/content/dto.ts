import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export const SUPPORTED_BLOCK_TYPES = [
  'hero',
  'services',
  'projects',
  'clarity',
] as const;

export class CreateBlockDto {
  @IsIn(SUPPORTED_BLOCK_TYPES)
  type!: string;

  @IsInt()
  @Min(0)
  position!: number;

  @IsObject()
  data!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateBlockDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreatePageDto {
  @IsString()
  @MinLength(2)
  slug!: string;

  @IsString()
  @MinLength(2)
  title!: string;
}
