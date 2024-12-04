/* eslint-disable prettier/prettier */
// multer.service.ts

import { Injectable } from '@nestjs/common';
import multer from 'multer';

@Injectable()
export class MulterService {
  multerInstance() {
    return multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, './uploads'); // Thư mục lưu trữ tạm thời
        },
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`); // Tên file tạm thời
        },
      }),
      limits: { fileSize: 200 * 1024 * 1024 }, // Cho phép file tối đa 200MB
      fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('image') || file.mimetype.includes('video')) {
          cb(null, true); // Cho phép ảnh và video
        } else {
          cb(new Error('Chỉ chấp nhận file ảnh hoặc video')); // Báo lỗi nếu không hợp lệ
        }
      },
    });
  }
}