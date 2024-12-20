/* eslint-disable prettier/prettier */
// src/services/cloudinary.service.ts
import { Injectable } from '@nestjs/common';
import { cloudinary } from './cloudinary.config';
import * as crypto from 'crypto';
import { Stream } from 'stream';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(fileBuffer: Buffer): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `folder=Top-Top/images&timestamp=${timestamp}`;
    const signature = this.generateSignature(stringToSign);

    return this.uploadToCloudinary(fileBuffer, {
      folder: 'Top-Top/images',
      timestamp: timestamp,
      signature: signature,
    });
  }

  async uploadVideo(fileBuffer: Buffer, userId: string): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `folder=Top-Top/videos/${userId}&timestamp=${timestamp}`;
    const signature = this.generateSignature(stringToSign);

    return this.uploadToCloudinary(fileBuffer, {
      folder: `Top-Top/videos/${userId}`,
      resource_type: 'video',
      timestamp: timestamp,
      signature: signature,
      userId: userId,
    });
  }

  private generateSignature(stringToSign: string): string {
    return crypto
      .createHash('sha1')
      .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
      .digest('hex');
  }

  private uploadToCloudinary(fileBuffer: Buffer, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          ...options,
          api_key: process.env.CLOUDINARY_API_KEY,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      const bufferStream = new Stream.PassThrough();
      bufferStream.end(fileBuffer);
      bufferStream.pipe(uploadStream);
    });
  }
}