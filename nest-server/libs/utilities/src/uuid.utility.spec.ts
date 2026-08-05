import { UuidUtility } from './uuid.utility';

describe('UuidUtility', () => {
  it('should generate valid v4 UUID', () => {
    const uuid = UuidUtility.generate();
    expect(uuid).toBeDefined();
    expect(UuidUtility.isValid(uuid)).toBe(true);
  });

  it('should return false for invalid UUID', () => {
    expect(UuidUtility.isValid('invalid-uuid')).toBe(false);
  });
});
