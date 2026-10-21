import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('login')
  @UseGuards(ThrottlerGuard)
  login(@Body() dto: LoginDto) {
    return this.service.login(dto.email, dto.password);
  }
}
