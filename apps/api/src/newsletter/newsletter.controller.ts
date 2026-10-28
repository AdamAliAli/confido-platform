import { Body, Controller, Delete, Get, Header, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IsEmail, MaxLength } from 'class-validator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { NewsletterService } from './newsletter.service';

export class SubscribeDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post()
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  subscribe(@Body() dto: SubscribeDto) { return this.service.subscribe(dto.email); }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  list() { return this.service.list(); }

  @Get('export')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="subscribers.csv"')
  export() { return this.service.export(); }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
