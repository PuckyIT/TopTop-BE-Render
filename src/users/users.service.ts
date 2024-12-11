/* eslint-disable prettier/prettier */
// user/user.service.ts

import { UpdateUserDto } from '../users/dto/update-user.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CloudinaryService } from '../configs/cloudinary/cloudinary.service';
import { CreateVideoDto } from './dto/upload-video.dto';
import { Video, VideoDocument } from '../schemas/video.schema';

interface PopulatedVideo extends Omit<Video, 'userId'> {
  userId: {
    _id: Types.ObjectId;
    username: string;
    avatar: string;
  };
}

@Injectable()
export class UsersService {
  [x: string]: any;
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
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

  async uploadVideo(createVideoDto: CreateVideoDto, videoFile: Express.Multer.File) {
    if (!videoFile || !videoFile.buffer) {
      throw new BadRequestException('Invalid video file');
    }

    const uploadedResponse = await this.cloudinaryService.uploadVideo(videoFile.buffer, createVideoDto.userId);

    const newVideo = new this.videoModel({
      ...createVideoDto,
      videoUrl: uploadedResponse.secure_url,
    });

    return newVideo.save();
  }

  async getUserVideos(userId: string) {
    const videos = await this.videoModel.find({ userId }).sort({ createdAt: -1 }).exec();
    if (!videos) {
      throw new NotFoundException('No videos found for this user');
    }
    return videos;
  }

  async followUser(userId: string, targetUserId: string) {
    const [user, targetUser] = await Promise.all([
      this.userModel.findById(userId),
      this.userModel.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    if (user.following.includes(targetUserId.toString())) {
      throw new BadRequestException('You are already following this user');
    }

    // Chuyển đổi targetUserId thành ObjectId để so sánh
    if (userId.toString() === targetUserId.toString()) {
      throw new BadRequestException('You cannot follow yourself');
    } else {
      await Promise.all([
        this.userModel.findByIdAndUpdate(userId, {
          $push: { following: targetUserId },
          $inc: { followingCount: 1 }
        }),
        this.userModel.findByIdAndUpdate(targetUserId, {
          $push: { followers: userId },
          $inc: { followersCount: 1 }
        })
      ]);

      return { message: 'Successfully followed user' };
    }
  }

  async unfollowUser(userId: string, targetUserId: string) {
    const [user, targetUser] = await Promise.all([
      this.userModel.findById(userId),
      this.userModel.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if not following
    if (!user.following.includes(targetUserId.toString())) {
      throw new BadRequestException('You are not following this user');
    }

    // Chuyển đổi targetUserId thành ObjectId để so sánh
    if (userId === targetUserId || userId === new Types.ObjectId(targetUserId).toString()) {
      throw new BadRequestException('You cannot unfollow yourself');
    } else {
      // Update both users
      await Promise.all([
        this.userModel.findByIdAndUpdate(userId, {
          $pull: { following: targetUserId },
          $inc: { followingCount: -1 }
        }),
        this.userModel.findByIdAndUpdate(targetUserId, {
          $pull: { followers: userId },
          $inc: { followersCount: -1 }
        })
      ]);

      return { message: 'Successfully unfollowed user' };
    }
  }

  async getFollowers(userId: string) {
    const user = await this.userModel.findById(userId)
      .populate('followers', 'username avatar bio followersCount followingCount likesCount')
      .select('username avatar followers')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      username: user.username,
      avatar: user.avatar,
      followers: user.followers
    };
  }

  async getFollowing(userId: string) {
    const user = await this.userModel.findById(userId)
      .populate('following', 'username avatar bio followersCount followingCount likesCount')
      .select('username avatar following')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      username: user.username,
      avatar: user.avatar,
      following: user.following
    };
  }

  async getPublicVideos(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.videoModel.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username avatar')
        .exec(),
      this.videoModel.countDocuments({ isPublic: true })
    ]);

    return {
      videos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalVideos: total,
        hasMore: page * limit < total
      }
    };
  }

  // Lấy tất cả video
  async getAllVideos() {
    const videos = await this.videoModel
      .find()
      .populate<{ userId: { _id: Types.ObjectId; username: string; avatar: string } }>({
        path: 'userId',
        select: 'avatar username'
      });

    return videos.map((video: PopulatedVideo) => ({
      id: video._id,
      desc: video.desc,
      isPublic: video.isPublic,
      createdAt: video.createdAt,
      title: video.title,
      views: video.views,
      likes: video.likes,
      videoUrl: video.videoUrl,
      commentCount: video.commentCount,
      saved: video.saved,
      shared: video.shared,
      likeBy: video.likedBy,
      savedBy: video.savedBy,
      user: {
        id: video.userId._id,
        username: video.userId.username,
        avatar: video.userId.avatar
      }
    }));
  }
}