/* eslint-disable prettier/prettier */
// user/user.service.ts

import { UpdateUserDto } from '../users/dto/update-user.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CloudinaryService } from '../configs/cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  [x: string]: any;
  constructor(@InjectModel(User.name)
  private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  findAll() {
    return `This action returns all users`;
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUserProfile(id: string, updateUserProfileDto: UpdateUserDto, avatarFile: Express.Multer.File) {
    let avatarUrl;
    if (avatarFile) {
      const uploadedResponse = await this.cloudinaryService.uploadImage(avatarFile.buffer); // Pass buffer instead of file
      avatarUrl = uploadedResponse.secure_url;
    }

    return await this.userModel.findByIdAndUpdate(id, {
      ...updateUserProfileDto,
      avatar: avatarUrl || updateUserProfileDto.avatar,
    });
  }
}