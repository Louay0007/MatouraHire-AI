import { Body, Controller, Get, Patch, Req, UseGuards, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ProfileService } from './profile.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  @Get('me')
  async me(@Req() req: any) {
    return this.service.getMe(req.user.sub);
  }

  @Patch()
  async update(@Req() req: any, @Body() body: { name?: string; avatarUrl?: string }) {
    return this.service.updateMe(req.user.sub, body);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return this.service.updateAvatar(req.user.sub, file);
  }
}


