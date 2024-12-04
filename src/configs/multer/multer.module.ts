/* eslint-disable prettier/prettier */
// config/multer.module.ts
import { Module } from '@nestjs/common';
import { MulterService } from './multer.config';

@Module({
  providers: [MulterService],
  exports: [MulterService],
})
export class MulterModule {}