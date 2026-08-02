import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from '@app/common';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: PermissionEnum[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
