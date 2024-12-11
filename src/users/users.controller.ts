/* eslint-disable prettier/prettier */
// user/user.controller.ts

import { Controller, Get, Body, Param, Delete, UseGuards, Put, Req, ForbiddenException, UseInterceptors, UploadedFile, Post, BadRequestException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateVideoDto } from './dto/upload-video.dto';
import { Public } from '../decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return req.user;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/:id')
  @UseInterceptors(FileInterceptor('avatar'))  // Handle 'avatar' file field
  async updateUserProfile(
    @Req() req,
    @Param('id') id: string,
    @UploadedFile() avatarFile: Express.Multer.File,
    @Body() updateUserProfileDto: UpdateUserDto,
  ) {
    const userIdFromToken = req.user.id;
    if (userIdFromToken !== id) {
      throw new ForbiddenException("You are not allowed to update another user's profile.");
    }
    return this.usersService.updateUserProfile(id, updateUserProfileDto, avatarFile);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('videoFile'))
  async uploadVideo(
    @UploadedFile() videoFile: Express.Multer.File,
    @Body() createVideoDto: CreateVideoDto,
  ) {
    if (!videoFile) {
      throw new BadRequestException('Video file is required');
    }
    return this.usersService.uploadVideo(createVideoDto, videoFile);
  }

  @Get(':userId/videos')
  @UseGuards(JwtAuthGuard)
  async getUserVideos(@Param('userId') userId: string) {
    return this.usersService.getUserVideos(userId);
  }

  @Get(':userId/followers')
  @UseGuards(JwtAuthGuard)
  async getFollowers(@Param('userId') userId: string) {
    return this.usersService.getFollowers(userId);
  }

  @Get(':userId/following')
  @UseGuards(JwtAuthGuard)
  async getFollowing(@Param('userId') userId: string) {
    return this.usersService.getFollowing(userId);
  }

  @Post(':targetUserId/follow')
  @UseGuards(JwtAuthGuard)
  async followUser(
    @Req() req,
    @Param('targetUserId') targetUserId: string
  ) {
    return this.usersService.followUser(req.user._id.toString(), targetUserId)
  }

  @Post(':targetUserId/unfollow')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(
    @Req() req,
    @Param('targetUserId') targetUserId: string
  ) {
    return this.usersService.unfollowUser(req.user._id, targetUserId);
  }

  @Public()
  @Get('public/videos')
  async getPublicVideos(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.usersService.getPublicVideos(page, limit);
  }  

  @Public()
  @Get('all')
  async getAllVideos() {
    const videos = await this.usersService.getAllVideos();
    return { videos };
  }
}
