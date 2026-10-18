import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  role!: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  quote?: string | null;

  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  photoUrl!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  xUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  dribbbleUrl?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  linkedinUrl?: string | null;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}
