/* eslint-disable prettier/prettier */
// user/user.controller.ts

import { Controller, Get, Body, Param, Delete, UseGuards, Put, Req, ForbiddenException, UseInterceptors, UploadedFile, Post, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateVideoDto } from './dto/upload-video.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

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
}
