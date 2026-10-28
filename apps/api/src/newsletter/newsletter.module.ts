import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';
import { NewsletterController } from './newsletter.controller';
import { NewsletterService } from './newsletter.service';

@Module({
  imports: [AuthModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: 5 }])],
  controllers: [NewsletterController],
  providers: [NewsletterService],
})
export class NewsletterModule {}
