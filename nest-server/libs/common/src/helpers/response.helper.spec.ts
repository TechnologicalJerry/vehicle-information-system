import { ResponseHelper } from './response.helper';

describe('ResponseHelper', () => {
  it('should format success response correctly', () => {
    const data = { id: 1, name: 'Test' };
    const response = ResponseHelper.success(data, 'Successfully fetched', 200);

    expect(response.success).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(response.message).toBe('Successfully fetched');
    expect(response.data).toEqual(data);
    expect(response.meta.timestamp).toBeDefined();
  });

  it('should format error response correctly', () => {
    const response = ResponseHelper.error('Invalid request', 400, { field: 'email' }, 'corr-123');

    expect(response.success).toBe(false);
    expect(response.statusCode).toBe(400);
    expect(response.message).toBe('Invalid request');
    expect(response.error).toEqual({ field: 'email' });
    expect(response.meta.correlationId).toBe('corr-123');
  });
});
