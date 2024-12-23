/* eslint-disable prettier/prettier */
// strategies/google.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://toptop-be.onrender.com/auth/google/callback',
      // callbackURL: 'http://localhost:8080/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    console.log('Google Profile:', profile); // In ra để kiểm tra nội dung
    const { emails, photos } = profile;

    if (!emails || emails.length === 0) {
      return done(new Error('Không tìm thấy email trong profile'), null);
    }

    const user = {
      email: emails[0]?.value,
      avatar: photos[0]?.value,
      _id: profile.id,
      accessToken,
      refreshToken
    };

    done(null, user);
  }
}