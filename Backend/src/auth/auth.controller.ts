import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; name: string; password: string }) {
    return this.service.register(body);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.service.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    return this.service.me(req.user.sub);
  }
}


