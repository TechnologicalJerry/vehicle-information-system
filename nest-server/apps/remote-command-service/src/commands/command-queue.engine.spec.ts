import { CommandQueueEngine } from './command-queue.engine';
import { CommandStatus } from '@app/common';

describe('CommandQueueEngine', () => {
  let engine: CommandQueueEngine;
  let prismaMock: any;
  let redisMock: any;
  let kafkaMock: any;

  beforeEach(() => {
    prismaMock = {
      remoteCommand: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    redisMock = {
      set: jest.fn(),
      del: jest.fn(),
    };
    kafkaMock = {
      emit: jest.fn(),
    };

    engine = new CommandQueueEngine(prismaMock, redisMock, kafkaMock);
  });

  it('should enqueue a pending command and store in Redis', async () => {
    const mockCommand = {
      id: 'cmd-123',
      vehicleId: 'veh-456',
      commandType: 'LOCK_DOORS',
      status: CommandStatus.PENDING,
      correlationId: 'corr-789',
    };

    prismaMock.remoteCommand.findUnique.mockResolvedValue(mockCommand);
    prismaMock.remoteCommand.update.mockResolvedValue({
      ...mockCommand,
      status: CommandStatus.QUEUED,
    });

    await engine.enqueueCommand('cmd-123');

    expect(prismaMock.remoteCommand.update).toHaveBeenCalledWith({
      where: { id: 'cmd-123' },
      data: { status: CommandStatus.QUEUED },
    });
    expect(redisMock.set).toHaveBeenCalled();
  });
});
