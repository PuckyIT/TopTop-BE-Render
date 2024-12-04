/* eslint-disable prettier/prettier */
// auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from '../jwt/jwt.strategy';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from '../strategies/google.strategy';
import { GitHubStrategy } from '../strategies/github.strategy';
import { MulterModule } from '../configs/multer/multer.module';
import { CloudinaryModule } from '../configs/cloudinary';
import { MongooseModule } from '@nestjs/mongoose';
import { TokenBlacklistSchema } from '../schemas/token-blacklist.schema';
import { UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    MulterModule,
    CloudinaryModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'TokenBlacklist', schema: TokenBlacklistSchema },
    ]), UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GitHubStrategy],
  controllers: [AuthController],
})
export class AuthModule { }
