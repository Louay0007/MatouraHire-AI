import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../schema/user.schema';
import { JwtStrategy } from './jwt.strategy';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: EXPIRES_IN } }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}


