/* eslint-disable prettier/prettier */
// user/user.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '../configs/multer/multer.module';
import { CloudinaryModule } from '../configs/cloudinary/cloudinary.module';
import { User, UserSchema } from '../schemas/user.schema';
import { Video, VideoSchema } from '../schemas/video.schema';

@Module({
  imports: [
    MulterModule,
    CloudinaryModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule { }