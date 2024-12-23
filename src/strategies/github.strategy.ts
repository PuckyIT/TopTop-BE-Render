/* eslint-disable prettier/prettier */
// strategies/github.strategy.ts

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'https://toptop-be.onrender.com/auth/github/callback',
      // callbackURL: 'http://localhost:8080/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    try {
      // Pass both the profile and accessToken to validateOAuthUser
      return this.authService.validateOAuthUser(profile, accessToken);
    } catch (error) {
      console.error('Error during GitHub OAuth validation:', error);
      throw error;
    }
  }
}
