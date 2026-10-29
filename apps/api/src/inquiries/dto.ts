import { Allow, IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export const INQUIRY_INTERESTS = ['Social Media Management', 'Brand Strategy', 'Positioning', 'Brand Systems', 'Something else'] as const;

export class CreateInquiryDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[\d +()\-]*$/)
  phone?: string;

  @IsIn(INQUIRY_INTERESTS)
  interest!: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  message!: string;

  // The trap is never stored. Any nonempty supplied value is treated as spam.
  @Allow()
  website?: unknown;
}

export class UpdateInquiryDto {
  @Transform(({ obj, key }) => obj[key])
  @IsBoolean()
  read!: boolean;
}
