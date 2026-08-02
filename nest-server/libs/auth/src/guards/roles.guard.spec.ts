import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { RoleEnum } from '@app/common';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as any;

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ roles: [RoleEnum.DRIVER] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleEnum.ADMIN]);
    const context = createMockContext({ roles: [RoleEnum.ADMIN, RoleEnum.DRIVER] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleEnum.SUPER_ADMIN]);
    const context = createMockContext({ roles: [RoleEnum.DRIVER] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
