import { ArrayUnique, IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

export const SUPPORTED_BLOCK_TYPES = ['hero', 'services', 'projects', 'clarity'] as const;

export class UpdateBlockDto {
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateOrderDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  ids!: string[];
}
