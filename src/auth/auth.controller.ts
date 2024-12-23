/* eslint-disable prettier/prettier */
// auth/auth.controller.ts

import { Controller, Post, Body, UnauthorizedException, Get, UseGuards, Req, Res, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string, username: string }) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
      loginDto.username,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.authService.login(user);
  }

  @Post('refresh-token')
  async refreshAccessToken(@Body() body: { refreshToken: string }) {
    const { refreshToken } = body;
    return await this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    // Lấy refreshToken từ request (cookie hoặc header)
    const refreshToken = req.body.refreshToken;

    if (refreshToken) {
      // Blacklist refreshToken
      await this.authService.blacklistToken(refreshToken); // Hủy refreshToken
    }

    // Xóa accessToken khỏi client (cookie hoặc localStorage)
    res.clearCookie('accessToken'); // Xóa accessToken khỏi cookie

    // Xóa refreshToken khỏi client (nếu lưu trong cookie)
    res.clearCookie('refreshToken'); // Xóa refreshToken khỏi cookie

    // Trả về phản hồi sau khi logout
    return res.status(200).json({ message: 'Successfully logged out' });
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Req() req) {
    // Đường dẫn này sẽ chuyển hướng đến Google để xác thực
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    const result = await this.authService.googleLogin(req);

    if (result) {
      const { access_token, user } = result;
      // Send a JSON response
      res.json({
        success: true,
        accessToken: access_token,
        email: user.email,
        avatar: user.avatar,
      });
      // Redirect to the specified URL
      return res.redirect('https://top-top-fe.vercel.app');
    } else {
      return res.json({ success: false });
    }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async githubAuth(@Req() req) {
    // Đường dẫn này sẽ chuyển hướng đến GitHub để xác thực
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req, @Res() res) {
    const result = await this.authService.githubLogin(req);

    if (result) {
      const { access_token, user } = result;
      // Send a JSON response
      res.json({
        success: true,
        accessToken: access_token,
        email: user.email,
        avatar: user.avatar,
      });
      // Redirect to the specified URL
      return res.redirect('https://top-top-fe.vercel.app');
    } else {
      return res.json({ success: false });
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password/:otp')
  async resetPassword(@Param('otp') otp: string, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(otp, resetPasswordDto);
  }
}