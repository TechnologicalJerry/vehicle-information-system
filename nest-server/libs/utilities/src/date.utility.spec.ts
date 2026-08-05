import { DateUtility } from './date.utility';

describe('DateUtility', () => {
  it('should return ISO timestamp string', () => {
    const timestamp = DateUtility.getCurrentTimestamp();
    expect(timestamp).toBeDefined();
    expect(new Date(timestamp).getTime()).not.toBeNaN();
  });

  it('should add minutes to date', () => {
    const now = new Date('2026-07-27T12:00:00.000Z');
    const future = DateUtility.addMinutes(now, 15);
    expect(future.toISOString()).toBe('2026-07-27T12:15:00.000Z');
  });
});
