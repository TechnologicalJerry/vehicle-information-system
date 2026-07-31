import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaMock: any;
  let mongoMock: any;

  beforeEach(() => {
    prismaMock = {
      auditLog: {
        create: jest
          .fn()
          .mockImplementation((args) => Promise.resolve({ id: 'log-123', ...args.data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };

    mongoMock = {
      create: jest.fn(),
    };

    service = new AuditService(prismaMock, mongoMock);
  });

  it('should create append-only audit log', async () => {
    await service.logAudit({
      service: 'VEHICLE_SERVICE',
      entityType: 'VEHICLE',
      entityId: 'veh-123',
      action: 'VEHICLE_STATUS_CHANGED',
      userId: 'user-456',
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalled();
  });
});
