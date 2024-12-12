/* eslint-disable prettier/prettier */
// src/videos/videos.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Video, VideoDocument } from '../schemas/video.schema';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
  ) { }

  async getVideo(_id: string): Promise<Video> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId)
      .populate('userId', 'avatar username') // Populate thông tin người đăng
      .populate('comments.userId', 'avatar username'); // Populate thông tin người comment

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return video;
  }

  async likeVideo(_id: string, userId: string): Promise<Video> {
    try {
      const videoObjectId = new Types.ObjectId(_id);
      const userObjectId = new Types.ObjectId(userId);

      const video = await this.videoModel.findById(videoObjectId);
      if (!video) {
        throw new NotFoundException('Video not found');
      }

      const hasLiked = video.likedBy.some(id => id.toString() === userObjectId.toString());

      if (hasLiked) {
        throw new ForbiddenException('You have already liked this video');
      }

      video.likes += 1;
      video.likedBy.push(userObjectId);
      return video.save();
    } catch (error) {
      if (error instanceof Error && error.name === 'BSONError') {
        throw new NotFoundException('Invalid ID format');
      }
      throw error;
    }
  }

  async unlikeVideo(_id: string, userId: string): Promise<Video> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const likedIndex = video.likedBy.indexOf(userObjectId);

    if (likedIndex !== -1) {
      video.likes = Math.max(0, video.likes - 1);
      video.likedBy.splice(likedIndex, 1);
      return video.save();
    }

    return video;
  }

  async addComment(_id: string, userId: string, content: string): Promise<Video> {
    // Kiểm tra và chuyển đổi _id sang ObjectId
    if (!Types.ObjectId.isValid(_id)) {
      throw new NotFoundException('Invalid video ID format');
    }
    const videoObjectId = new Types.ObjectId(_id);

    // Kiểm tra video có tồn tại không
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Kiểm tra và chuyển đổi userId sang ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }
    const userObjectId = new Types.ObjectId(userId);

    // Tạo comment
    const comment = {
      _id: new Types.ObjectId(), // Tạo ObjectId mới cho comment
      videoId: videoObjectId,
      userId: userObjectId, // Gán ObjectId cho userId
      content,
      createdAt: new Date(),
    };

    // Thêm comment vào video
    video.comments.push(comment);
    video.commentCount = video.comments.length;

    // Lưu video
    return video.save();
  }


  async deleteComment(_id: string, commentId: string, userId: string): Promise<Video> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const comment = video.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    video.comments = video.comments.filter(c => c._id.toString() !== commentId);
    video.commentCount = video.comments.length; // Cập nhật số lượng comment
    return video.save();
  }

  async incrementViews(_id: string): Promise<Video> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    video.views += 1;
    return video.save();
  }

  async saveVideo(_id: string, userId: string): Promise<Video> {
    try {
      const videoObjectId = new Types.ObjectId(_id);
      const userObjectId = new Types.ObjectId(userId);

      const video = await this.videoModel.findById(videoObjectId);
      if (!video) {
        throw new NotFoundException('Video not found');
      }

      const hasSaved = video.savedBy.some(id => id.toString() === userObjectId.toString());

      if (hasSaved) {
        throw new ForbiddenException('You have already saved this video');
      }

      video.savedBy.push(userObjectId);
      video.saved += 1;
      return video.save();
    } catch (error) {
      if (error instanceof Error && error.name === 'BSONError') {
        throw new NotFoundException('Invalid ID format');
      }
      throw error;
    }
  }

  async unsaveVideo(_id: string, userId: string): Promise<Video> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    const savedIndex = video.savedBy.indexOf(userObjectId);

    if (savedIndex !== -1) {
      video.saved = Math.max(0, video.saved - 1);
      video.savedBy.splice(savedIndex, 1);
      return video.save();
    }

    return video;
  }

  async shareVideo(_id: string, userId: string): Promise<Video> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const userObjectId = new Types.ObjectId(userId);
    video.shared += 1;
    video.sharedBy.push(userObjectId);

    // TODO: Implement message sending logic here
    // This should integrate with your messaging system to send the video to the receiver

    return video.save();
  }
}
