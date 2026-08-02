import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AuthUtilsService {
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateRandomToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  sanitizeUser<T extends Record<string, any>>(
    user: T,
    fieldsToOmit: string[] = ['password', 'salt', 'token'],
  ): Partial<T> {
    const sanitized = { ...user };
    fieldsToOmit.forEach((field) => delete sanitized[field]);
    return sanitized;
  }
}
