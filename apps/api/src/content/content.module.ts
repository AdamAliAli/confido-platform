import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  imports: [AuthModule],
  controllers: [ContentController],
  providers: [ContentService, PrismaService],
})
export class ContentModule {}
