import { Body, Controller, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsIn } from 'class-validator';
import { createHash } from 'node:crypto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

export class SignUploadDto {
  @IsIn(['confido/team', 'confido/gallery', 'confido/site'])
  folder!: 'confido/team' | 'confido/gallery' | 'confido/site';
}

@Controller('media')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'EDITOR')
export class MediaController {
  @Post('sign')
  sign(@Body() { folder }: SignUploadDto) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const secret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName?.trim() || !apiKey?.trim() || !secret?.trim()) {
      throw new ServiceUnavailableException('Photo uploads are unavailable. Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the API.');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${secret}`)
      .digest('hex');
    return { cloudName, apiKey, timestamp, folder, signature };
  }
}
