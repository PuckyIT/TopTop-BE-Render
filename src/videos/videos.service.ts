/* eslint-disable prettier/prettier */
// src/videos/videos.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Video, VideoDocument } from '../schemas/video.schema';
import { User, UserDocument } from 'src/schemas/user.schema';

// interface PopulatedVideo extends Omit<Video, 'userId'> {
//   userId: {
//     _id: Types.ObjectId;
//     username: string;
//     avatar: string;
//   };
// }

type filteredComments = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  createdAt: Date;
  username: string;
  avatar: string;
};

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

  async addComment(_id: string, userId: string, content: string): Promise<{ comments: filteredComments[] }> {
    // Check and convert _id to ObjectId
    if (!Types.ObjectId.isValid(_id)) {
      throw new NotFoundException('Invalid video ID format');
    }
    const videoObjectId = new Types.ObjectId(_id);

    // Check if the video exists
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check and convert userId to ObjectId
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Invalid user ID format');
    }
    const userObjectId = new Types.ObjectId(userId);

    // Fetch user details (username and avatar) in one query
    const user = await this.userModel.findById(userObjectId).select('username avatar');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create comment
    const comment = {
      _id: new Types.ObjectId(),
      videoId: videoObjectId,
      userId: userObjectId,
      content,
      username: user.username,
      avatar: user.avatar,
      createdAt: new Date(),
    };

    // Add comment to video
    video.comments.push(comment);
    video.commentCount = video.comments.length;

    // Save video
    await video.save();

    // Map comments to desired format
    const filteredComments = video.comments.map(comment => ({
      _id: comment._id,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      username: comment.username,
      avatar: comment.avatar,
    }));

    return { comments: filteredComments };
  }

  async deleteComment(_id: string, commentId: string, userId: string): Promise<{ comments: filteredComments[] }> {
    // Convert video ID to ObjectId
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Find the comment to be deleted
    const comment = video.comments.find((c) => c._id.toString() === commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if the user owns the comment
    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Remove the comment
    video.comments = video.comments.filter((c) => c._id.toString() !== commentId);
    video.commentCount = video.comments.length;

    // Save the updated video document
    await video.save();

    // Map the comments to include desired fields
    const filteredComments = video.comments.map((comment) => ({
      _id: comment._id,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      username: comment.username,
      avatar: comment.avatar,
    }));

    // Return the updated comments
    return { comments: filteredComments };
  }

  async updateComment(_id: string, commentId: string, content: string, userId: string): Promise<{ comments: filteredComments[] }> {
    // Convert video ID to ObjectId
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Find the specific comment
    const comment = video.comments.find((c) => c._id.toString() === commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if the user owns the comment
    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    // Update the comment content
    comment.content = content;

    // Save the updated video document
    await video.save();

    // Map the comments to include desired fields
    const filteredComments = video.comments.map((comment) => ({
      _id: comment._id,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      username: comment.username,
      avatar: comment.avatar,
    }));

    // Return the updated comments
    return { comments: filteredComments };
  }

  async getComments(_id: string): Promise<{ comments: filteredComments[] }> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findById(videoObjectId);

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Map comments to only include the desired properties
    const filteredComments = video.comments.map(comment => ({
      _id: comment._id,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt,
      username: comment.username,
      avatar: comment.avatar,
    }));

    return { comments: filteredComments };
  }

  async deleteVideo(_id: string): Promise<Video> {
    const videoObjectId = new Types.ObjectId(_id);
    const video = await this.videoModel.findByIdAndDelete(videoObjectId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return video;
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

  async getAllVideos() {
    const videos = await this.videoModel.find().populate('userId', 'username avatar');
    return videos.map(video => ({
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
      likedBy: video.likedBy,
      savedBy: video.savedBy,
      sharedBy: video.sharedBy,
      comments: video.comments,
      userId: video.userId,
    }));
  }

  async getFriendsVideos(userId: string) {
    console.log(`Fetching videos for userId: ${userId}`); // Log userId

    // Fetch the user and populate friends
    console.log(`Querying user with ID: ${userId}`); // Log the query
    const user = await this.userModel
      .findById(userId)
      .populate('friends', 'username avatar');

    // Check if user is found
    if (!user) {
      console.error(`User not found for userId: ${userId}`); // Log if user is not found
      return []; // Return empty array if user is not found
    }

    // Check if friends exist
    if (!user.friends || user.friends.length === 0) {
      console.log(`User has no friends`); // Log if no friends
      return []; // Return empty array if no friends
    }

    // Fetch videos of friends
    const friendsVideos = await this.videoModel.find({
      userId: { $in: user.friends.map(friend => friend._id) },
      isPublic: true,
    }).populate('userId', 'username avatar');

    return friendsVideos;
  }

  async getFollowingVideos(userId: string): Promise<Video[]> {
    const userObjectId = new Types.ObjectId(userId);

    // Fetch the user's following list
    const user = await this.userModel.findById(userObjectId).select('following');
    if (!user) throw new NotFoundException('User not found');

    // Fetch videos of users in the following list
    return this.videoModel
      .find({ userId: { $in: user.following } }) // Query Video model
      .populate('userId', 'avatar username') // Populate user details
      .sort({ createdAt: -1 }); // Sort videos by newest first
  }
}
