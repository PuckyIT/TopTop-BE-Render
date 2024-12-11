/* eslint-disable prettier/prettier */
// jwt/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
        if (isPublic) {
            return true;
        }

        const canActivateResult = super.canActivate(context);

        // Xử lý nếu giá trị trả về là Promise
        if (canActivateResult instanceof Promise) {
            return canActivateResult.then((result) => Boolean(result));
        }

        // Trả về trực tiếp nếu là boolean
        return Boolean(canActivateResult);
    }
}