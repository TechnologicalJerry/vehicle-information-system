export const createMockKafkaService = () => ({
  checkHealth: jest.fn().mockResolvedValue(true),
  getProducer: jest.fn().mockResolvedValue({
    send: jest.fn().mockResolvedValue([]),
    connect: jest.fn().mockResolvedValue(undefined),
  }),
});
