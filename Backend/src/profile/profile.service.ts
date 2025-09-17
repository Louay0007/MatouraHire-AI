import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';

@Injectable()
export class ProfileService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getMe(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async updateMe(userId: string, data: { name?: string; avatarUrl?: string }) {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.avatarUrl !== undefined) update.avatarUrl = data.avatarUrl;
    const user = await this.userModel.findByIdAndUpdate(userId, update, { new: true }).lean();
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    // Store avatar as base64 DataURL in DB for simplicity (small images recommended)
    // In production, upload to S3/Cloud and save URL instead
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const user = await this.userModel.findByIdAndUpdate(userId, { avatarUrl: base64 }, { new: true }).lean();
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user as any;
    return safe;
  }
}


