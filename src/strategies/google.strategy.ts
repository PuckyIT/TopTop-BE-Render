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
    try {
      // Pass both the profile and accessToken to validateOAuthUser
      const user = await this.authService.validateOAuthUser(profile, accessToken);
      done(null, user); // Return user if successful
    } catch (error) {
      done(error, false); // Handle error in validation
    }
  }
}