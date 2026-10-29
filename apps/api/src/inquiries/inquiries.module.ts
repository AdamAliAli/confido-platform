import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])],
  controllers: [InquiriesController], providers: [InquiriesService],
})
export class InquiriesModule {}
