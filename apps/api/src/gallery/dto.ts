import { ArrayUnique, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class GalleryEditDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(120) client?: string;
  @IsOptional() @IsIn(['Reels', 'Posts', 'Campaigns', 'Branding']) category?: string;
  @IsOptional() @IsBoolean() enabled?: boolean;
}

export class GalleryCreateDto {
  @IsIn(['brand', 'work']) section!: string;
  @IsIn(['image', 'video']) mediaType!: string;
  @IsString() @Matches(/^confido\/gallery\/[\w\-/]+$/) publicId!: string;
  @IsString() @MinLength(1) @MaxLength(120) title!: string;
  @IsOptional() @IsString() @MaxLength(120) client?: string;
  @IsOptional() @IsIn(['Reels', 'Posts', 'Campaigns', 'Branding']) category?: string;
  @IsInt() @Min(1) width!: number;
  @IsInt() @Min(1) height!: number;
}

export class GalleryOrderDto {
  @IsIn(['brand', 'work']) section!: string;
  @IsArray() @ArrayUnique() @IsString({ each: true }) ids!: string[];
}
