import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async register(input: { email: string; name: string; password: string }) {
    const existing = await this.userModel.findOne({ email: input.email.toLowerCase() }).lean();
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.userModel.create({ email: input.email, name: input.name, passwordHash, roles: ['user'] });
    return this.issueTokens(user);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.userModel.findOne({ email: input.email.toLowerCase() });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user);
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new UnauthorizedException();
    const { passwordHash, ...safe } = user as any;
    return safe;
  }

  private issueTokens(user: UserDocument) {
    const payload = { sub: String(user._id), email: user.email, roles: user.roles };
    const access_token = this.jwt.sign(payload);
    return { access_token, user: { id: String(user._id), email: user.email, name: user.name, roles: user.roles, avatarUrl: user.avatarUrl } };
  }
}


