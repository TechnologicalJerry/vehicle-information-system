export const createMockPrismaService = () => ({
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  systemHealthCheck: {
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({ id: 'test-uuid', status: 'UP' }),
  },
});
