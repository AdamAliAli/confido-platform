import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RevalidationService } from '../common/revalidation.service';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({ imports: [AuthModule], controllers: [GalleryController], providers: [GalleryService, RevalidationService] })
export class GalleryModule {}
