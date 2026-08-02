import { BcryptUtilsService } from './bcrypt-utils.service';

describe('BcryptUtilsService', () => {
  let service: BcryptUtilsService;

  beforeEach(() => {
    service = new BcryptUtilsService();
  });

  it('should hash and compare passwords correctly', async () => {
    const rawPassword = 'P@ssw0rd123!';
    const hash = await service.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(rawPassword);

    const isMatch = await service.comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await service.comparePassword('WrongPass123!', hash);
    expect(isWrong).toBe(false);
  });

  it('should validate password strength correctly', () => {
    expect(() => service.validatePasswordStrength('P@ssw0rd123!')).not.toThrow();
    expect(() => service.validatePasswordStrength('weak')).toThrow();
  });
});
