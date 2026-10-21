import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be set and contain at least 32 characters before the API can start.');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({ origin: (process.env.FRONTEND_URL || '').split(','), credentials: true });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  app.useGlobalFilters(new PrismaExceptionFilter(app.getHttpAdapter()));
  app.enableShutdownHooks();
  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();
