import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PermissionEnum } from '@app/common';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it('should allow access if no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ permissions: [PermissionEnum.TELEMETRY] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PermissionEnum.USER_MANAGEMENT]);
    const context = createMockContext({
      permissions: [PermissionEnum.USER_MANAGEMENT, PermissionEnum.FLEET_MANAGEMENT],
    });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([PermissionEnum.USER_MANAGEMENT]);
    const context = createMockContext({ permissions: [PermissionEnum.TELEMETRY] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
