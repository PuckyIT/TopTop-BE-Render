/* eslint-disable prettier/prettier */
// user/user.module.ts

import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '../configs/multer/multer.module';
import { CloudinaryModule } from '../configs/cloudinary/cloudinary.module';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [MulterModule, CloudinaryModule, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }