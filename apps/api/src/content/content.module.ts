import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { RevalidationService } from '../common/revalidation.service';

@Module({
  imports: [AuthModule],
  controllers: [ContentController],
  providers: [ContentService, RevalidationService],
})
export class ContentModule {}
