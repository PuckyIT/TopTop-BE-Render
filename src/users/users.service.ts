/* eslint-disable prettier/prettier */
// user/user.service.ts

import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { CloudinaryService } from '../configs/cloudinary/cloudinary.service';
import { CreateVideoDto } from './dto/upload-video.dto';
import { Video, VideoDocument } from '../schemas/video.schema';
import { Chat, ChatDocument } from 'src/schemas/chat.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  findAll() {
    return `This action returns all users`;
  }

  async findOneByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findOneByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findOne(id: string): Promise<UserDocument | null> {
    const userId = new Types.ObjectId(id);
    const user = await this.userModel.findById(userId).exec();
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

    return await this.userModel.findByIdAndUpdate(new Types.ObjectId(id), {
      ...updateUserProfileDto,
      avatar: avatarUrl || updateUserProfileDto.avatar,
    });
  }

  async uploadVideo(createVideoDto: CreateVideoDto, videoFile: Express.Multer.File) {
    if (!videoFile || !videoFile.buffer) {
      throw new BadRequestException('Invalid video file');
    }

    // Upload video lên Cloudinary
    const uploadedResponse = await this.cloudinaryService.uploadVideo(videoFile.buffer, createVideoDto.userId.toString());

    // Tạo video mới với userId là _id của người dùng
    const newVideo = new this.videoModel({
      _id: new Types.ObjectId(),
      ...createVideoDto,
      userId: new Types.ObjectId(createVideoDto.userId),
      videoUrl: uploadedResponse.secure_url,
    });

    // Lưu video vào MongoDB
    return newVideo.save();
  }

  async getUserVideos(userId: string) {
    const videoUserId = new Types.ObjectId(userId);
    const videos = await this.videoModel.find({ userId: videoUserId }).sort({ createdAt: -1 }).exec();
    if (!videos) {
      throw new NotFoundException('No videos found for this user');
    }
    return videos;
  }

  async followUser(userId: string, targetUserId: string) {
    const userIdObj = new Types.ObjectId(userId);
    const targetUserIdObj = new Types.ObjectId(targetUserId);
    const [user, targetUser] = await Promise.all([
      this.userModel.findById(userIdObj),
      this.userModel.findById(targetUserIdObj)
    ]);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    if (user.following.includes(targetUserIdObj)) {
      throw new BadRequestException('You are already following this user');
    }

    // Prevent following self
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    await Promise.all([
      this.userModel.findByIdAndUpdate(userIdObj, {
        $push: { following: targetUserIdObj },
        $inc: { followingCount: 1 },
      }),
      this.userModel.findByIdAndUpdate(targetUserIdObj, {
        $push: { followers: userIdObj },
        $inc: { followersCount: 1 },
      }),
    ]);

    return { message: 'Successfully followed user' };
  }

  async unfollowUser(userId: string, targetUserId: string) {
    const userIdObj = new Types.ObjectId(userId);
    const targetUserIdObj = new Types.ObjectId(targetUserId);
    const [user, targetUser] = await Promise.all([
      this.userModel.findById(userIdObj),
      this.userModel.findById(targetUserIdObj)
    ]);

    if (!user || !targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if not following
    if (!user.following.includes(targetUserIdObj)) {
      throw new BadRequestException('You are not following this user');
    }

    // Prevent unfollowing self
    if (userId === targetUserId) {
      throw new BadRequestException('You cannot unfollow yourself');
    }

    await Promise.all([
      this.userModel.findByIdAndUpdate(userIdObj, {
        $pull: { following: targetUserIdObj },
        $inc: { followingCount: -1 },
      }),
      this.userModel.findByIdAndUpdate(targetUserIdObj, {
        $pull: { followers: userIdObj },
        $inc: { followersCount: -1 },
      }),
    ]);

    return { message: 'Successfully unfollowed user' };
  }

  async getFollowers(userId: string) {
    if (!userId || userId.length !== 24) {
      throw new BadRequestException('Invalid user ID format.');
    }

    const userIdObj = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userIdObj)
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
    if (!userId || userId.length !== 24) {
      throw new BadRequestException('Invalid user ID format.');
    }

    const userIdObj = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userIdObj)
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

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('You cannot send a friend request to yourself');
    }

    const senderIdObj = new Types.ObjectId(senderId);
    const receiverIdObj = new Types.ObjectId(receiverId);
    const [sender, receiver] = await Promise.all([
      this.userModel.findById(senderIdObj),
      this.userModel.findById(receiverIdObj),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if already friends
    if (receiver.friends.includes(senderIdObj)) {
      throw new BadRequestException('You are already friends');
    }

    // Check if friend request is already sent
    if (receiver.friendRequests.includes(senderIdObj)) {
      throw new BadRequestException('Friend request already sent');
    }

    // Add senderId to the receiver's friendRequests
    await this.userModel.findByIdAndUpdate(receiverIdObj, {
      $addToSet: { friendRequests: senderIdObj },
    });

    return { message: 'Friend request sent successfully' };
  }

  async getFriendRequests(userId: string) {
    const userIdObj = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userIdObj).populate({
      path: 'friendRequests',
      select: 'username email avatar',
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.friendRequests;
  }

  async getFriends(userId: string) {
    const userIdObj = new Types.ObjectId(userId);
    const user = await this.userModel.findById(userIdObj).populate('friends', 'username avatar');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.friends;
  }

  async acceptFriendRequest(receiverId: string, senderId: string) {
    const receiverIdObj = new Types.ObjectId(receiverId);
    const senderIdObj = new Types.ObjectId(senderId);
    const [receiver, sender] = await Promise.all([
      this.userModel.findById(receiverIdObj),
      this.userModel.findById(senderIdObj),
    ]);

    if (!receiver || !sender) {
      throw new NotFoundException('User not found');
    }

    // Check if the friend request exists
    if (!receiver.friendRequests.includes(senderIdObj)) {
      throw new BadRequestException('No pending friend request from this user');
    }

    // Update both users to include each other as friends
    await Promise.all([
      this.userModel.findByIdAndUpdate(receiverIdObj, {
        $addToSet: { friends: senderIdObj },
        $pull: { friendRequests: senderIdObj }, // Remove from pending requests
      }),
      this.userModel.findByIdAndUpdate(senderIdObj, {
        $addToSet: { friends: receiverIdObj },
      }),
    ]);

    return { message: 'Friend request accepted successfully' };
  }


  async rejectFriendRequest(receiverId: string, senderId: string) {
    const receiverIdObj = new Types.ObjectId(receiverId);
    const senderIdObj = new Types.ObjectId(senderId);
    const receiver = await this.userModel.findById(receiverIdObj);

    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    // Check if the sender's request exists
    if (!receiver.friendRequests.includes(senderIdObj)) {
      throw new BadRequestException('No pending friend request from this user');
    }

    // Remove senderId from the receiver's friendRequests array
    await this.userModel.findByIdAndUpdate(receiverIdObj, {
      $pull: { friendRequests: senderIdObj },
    });

    return { message: 'Friend request rejected successfully' };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return await createdUser.save();
  }

  async findById(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async sendMessage(senderId: string, receiverId: string, content: string, type: 'text' | 'video' | 'image'): Promise<Chat> {
    if (!Types.ObjectId.isValid(senderId) || !Types.ObjectId.isValid(receiverId)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const senderObjectId = new Types.ObjectId(senderId);
    const receiverObjectId = new Types.ObjectId(receiverId);

    const message = await this.chatModel.create({
      sender: senderObjectId,
      receiver: receiverObjectId,
      content,
      type,
    });

    return message;
  }

  async getChatHistory(userId1: string, userId2: string): Promise<Chat[]> {
    if (!Types.ObjectId.isValid(userId1) || !Types.ObjectId.isValid(userId2)) {
      throw new NotFoundException('Invalid user ID format');
    }

    const user1ObjectId = new Types.ObjectId(userId1);
    const user2ObjectId = new Types.ObjectId(userId2);

    const chatHistory = await this.chatModel
      .find({
        $or: [
          { sender: user1ObjectId, receiver: user2ObjectId },
          { sender: user2ObjectId, receiver: user1ObjectId },
        ],
      })
      .sort({ createdAt: 1 })
      .exec();

    return chatHistory;
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.userModel
      .find({
        username: { $regex: query, $options: "i" },
      })
      .select("id username avatar")
      .lean();
  }
}