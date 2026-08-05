export const createMockMqttService = () => ({
  isHealthy: jest.fn().mockReturnValue(true),
  publish: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue([]),
});
