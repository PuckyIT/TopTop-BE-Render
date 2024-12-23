/* eslint-disable prettier/prettier */
// auth/auth.service.ts

import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../schemas/user.schema';
import axios from 'axios';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { InjectModel } from '@nestjs/mongoose';
import { TokenBlacklist } from '../schemas/token-blacklist.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('TokenBlacklist') private tokenBlacklistModel: Model<TokenBlacklist>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) { }

  async create(createUserDto: { email: string, password: string | null, avatar?: { uid: string } | null, username: string }): Promise<User> {
    const { email, password, avatar, username } = createUserDto;
    const userInitials = email
      ? email
        .split("@")[0]
        .split(" ")
        .map((word: string) => word[0])
        .join("")
        .toUpperCase()
      : "U";

    // Kiểm tra nếu username đã tồn tại
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new ConflictException('Username đã tồn tại. Vui lòng chọn username khác.');
    }

    let avatarUid = userInitials;
    if (avatar && avatar.uid) {
      avatarUid = avatar.uid;
    }

    // Kiểm tra nếu password tồn tại (chỉ hash nếu không phải OAuth)
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const createdUser = new this.userModel({
      email,
      password: hashedPassword,
      username,
      avatar: avatarUid,
    });

    return createdUser.save();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validateUser(email: string, password: string, username: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Trả về token và thông tin người dùng (không bao gồm mật khẩu)
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive = true,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        likesCount: user.likesCount
      },
    };
  }

  async blacklistToken(refreshToken: string): Promise<void> {
    try {
      // Kiểm tra và giải mã refreshToken
      const payload = this.jwtService.verify(refreshToken, { secret: 'mySuperSecretKey' });

      // Lưu refreshToken vào cơ sở dữ liệu
      await this.tokenBlacklistModel.create({
        token: refreshToken,
        userId: payload.sub,
        createdAt: new Date(),
      });

      console.log('RefreshToken has been blacklisted');
    } catch (error) {
      console.error('Error blacklisting refresh token:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Phương thức kiểm tra refreshToken có nằm trong blacklist hay không
  async isTokenBlacklisted(refreshToken: string): Promise<boolean> {
    const tokenRecord = await this.tokenBlacklistModel.findOne({ token: refreshToken }).exec();
    return !!tokenRecord; // Nếu tìm thấy token thì trả về true, nếu không thì false
  }

  // Phương thức refresh token
  async refreshToken(refreshToken: string) {
    try {
      // Kiểm tra xem refreshToken có nằm trong blacklist không
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token is blacklisted');
      }

      // Nếu refreshToken không bị blacklist, tiếp tục xử lý như bình thường
      const payload = this.jwtService.verify(refreshToken, { secret: 'mySuperSecretKey' });

      // Tạo lại accessToken mới
      const newAccessToken = this.jwtService.sign({ email: payload.email, sub: payload.sub }, { expiresIn: '1h' });

      return { access_token: newAccessToken };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateOAuthUser(profile: any, accessToken: string, username?: string): Promise<User> {
    let email = profile.emails && profile.emails.length ? profile.emails[0].value : null;
    const avatar = profile.photos && profile.photos.length ? profile.photos[0].value : profile._json?.avatar_url;

    if (!email) {
      try {
        const response = await axios.get('https://api.github.com/user/emails', {
          headers: { Authorization: `token ${accessToken}` },
        });
        const emails = response.data;
        const primaryEmail = emails.find((email: any) => email.primary)?.email;
        if (primaryEmail) {
          email = primaryEmail;
        } else {
          throw new Error('Primary email not found');
        }
      } catch (error) {
        console.error('Error fetching email from GitHub:', error);
        throw new Error('Email not found');
      }
    }

    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      if (avatar && existingUser.avatar !== avatar) {
        existingUser.avatar = avatar;
        await existingUser.save();
      }
      return existingUser;
    }

    const isUsernameTaken = await this.usersService.findOneByUsername(username);
    if (isUsernameTaken) {
      throw new ConflictException('Username is already taken');
    }

    const newUser = await this.usersService.create({
      email,
      password: null,
      username,
      avatar,
    });

    return newUser;
  }

  // async googleLogin(req: any) {
  //   if (!req.user) {
  //     return null; // Trả về null nếu không lấy được user
  //   }

  //   const user = await this.usersService.findOneByEmail(req.user.email); // Lấy lại người dùng từ DB

  //   const payload = { email: user.email, sub: user._id };
  //   const access_token = this.jwtService.sign(payload);

  //   return {
  //     access_token,
  //     user: {
  //       id: user._id,
  //       email: user.email,
  //       name: user.name,
  //       avatar: user.avatar, // Avatar từ cơ sở dữ liệu
  //     },
  //   };
  // }

  async googleLogin(req: any) {
    if (!req.user) {
      return null; // Trả về null nếu không lấy được user
    }
  
    // Tìm kiếm user dựa trên email
    let user = await this.userModel.findOne({ email: req.user.email });
  
    if (!user) {
      // Sử dụng this.create thay vì this.usersService.create
      user = await this.userModel.create({
        email: req.user.email,
        username: req.user.email.split('@')[0],
        password: null, // OAuth không yêu cầu password
        avatar: req.user.avatar,
      });
    }
  
    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);
  
    return {
      access_token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }

  async githubLogin(req: any) {
    if (!req.user) {
      return null; // Trả về null nếu không lấy được user
    }

    // Tìm người dùng trong DB bằng email từ profile GitHub
    const user = await this.usersService.findOneByEmail(req.user.email);

    // Tạo payload cho JWT
    const payload = { email: user.email, sub: user._id };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Kiểm tra xem OTP đã được tạo trước đó chưa và còn hiệu lực không
    if (user.resetOtp && user.resetOtpExpire.getTime() > Date.now()) {
      throw new ConflictException('OTP đã được gửi và còn hiệu lực. Vui lòng kiểm tra email của bạn.');
    }

    // Tạo OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000;

    // Lưu OTP và thời gian hết hạn vào cơ sở dữ liệu
    user.resetOtp = otp;
    user.resetOtpExpire = new Date(otpExpire);

    await user.save();

    // Gửi email chứa mã OTP cho người dùng
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Cài đặt lại mật khẩu',
      text: `Bạn đã yêu cầu đặt lại mật khẩu. OTP của bạn là ${otp}. Mã này sẽ hết hạn sau 10 phút.`,
    });

    return { message: 'OTP gửi thành công' };
  }

  async resetPassword(otp: string, resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email, newPassword } = resetPasswordDto;

    // Tìm user theo email và OTP, kiểm tra OTP còn hiệu lực không
    const user = await this.userModel.findOne({
      email,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() }, // OTP vẫn còn hiệu lực
    });

    if (!user) {
      throw new NotFoundException('OTP không hợp lệ hoặc đã hết hạn');
    }

    // Mã hóa mật khẩu mới và cập nhật
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined; // Xóa OTP sau khi sử dụng
    user.resetOtpExpire = undefined; // Xóa thời gian hết hạn
    await user.save();

    return { message: 'Mật khẩu đã được đặt lại' };
  }
}