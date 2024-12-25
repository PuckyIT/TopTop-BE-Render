/* eslint-disable prettier/prettier */

import { Controller, Post, Delete, Param, Body, UseGuards, Request, Req, Get, Put } from '@nestjs/common';
import { VideosService } from './videos.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { Public } from 'src/decorators/public.decorator';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) { }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async likeVideo(@Param('id') _id: string, @Request() req) {
    return this.videosService.likeVideo(_id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  async unlikeVideo(@Param('id') _id: string, @Request() req) {
    return this.videosService.unlikeVideo(_id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  async addComment(
    @Param('id') _id: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.videosService.addComment(_id, req.user.id, content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/comment/:commentId')
  async deleteComment(
    @Param('id') _id: string,
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    return this.videosService.deleteComment(_id, commentId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/comment/:commentId')
  async updateComment(
    @Param('id') _id: string,
    @Param('commentId') commentId: string,
    @Body('content') content: string,
    @Request() req,
  ) {
    return this.videosService.updateComment(_id, commentId, content, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/comments')  
  async getComments(@Param('id') _id: string) {
    return this.videosService.getComments(_id);
  }

  @Post(':id/view')
  async incrementViews(
    @Param('id') _id: string,
    @Body('watchDuration') watchDuration: number,
    @Body('totalDuration') totalDuration: number,
  ) {
    // Only count as view if user watched at least 80% of video
    const viewThreshold = 0.8;
    const watchPercentage = watchDuration / totalDuration;

    if (watchPercentage >= viewThreshold) {
      return this.videosService.incrementViews(_id);
    }
    return { message: 'Watch duration too short to count as view' };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save')
  async saveVideo(@Param('id') _id: string, @Request() req) {
    return this.videosService.saveVideo(_id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/save')
  async unsaveVideo(@Param('id') _id: string, @Request() req) {
    return this.videosService.unsaveVideo(_id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  async shareVideo(
    @Param('id') _id: string,
    @Request() req,
  ) {
    return this.videosService.shareVideo(_id, req.user.id);
  }

  @Get('friends')
  @UseGuards(JwtAuthGuard)
  async getFriendsVideos(@Req() req) {
    const userId = req.user._id;
    return this.videosService.getFriendsVideos(userId);
  }

  @Get('following')
  @UseGuards(JwtAuthGuard)
  async getFollowingVideos(@Req() req) {
    const userId = req.user._id;
    return this.videosService.getFollowingVideos(userId);
  }

  @Public()
  @Get('all')
  async getAllVideos() {
    const videos = await this.videosService.getAllVideos();
    return { videos };
  }
}
