import { FirmwareService } from './firmware.service';
import { BadRequestException } from '@nestjs/common';

describe('FirmwareService', () => {
  let service: FirmwareService;
  let prismaMock: any;
  let redisMock: any;

  beforeEach(() => {
    prismaMock = {
      firmware: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    redisMock = {
      set: jest.fn(),
    };

    service = new FirmwareService(prismaMock, redisMock);
  });

  it('should reject firmware creation if SHA-256 checksum is invalid', async () => {
    const invalidDto: any = {
      version: 'v2.5.0',
      releaseName: 'Release 2.5',
      checksum: 'invalid-checksum',
      releaseDate: '2026-07-28T00:00:00.000Z',
      supportedModels: ['MODEL_S'],
    };

    await expect(service.createFirmware(invalidDto)).rejects.toThrow(BadRequestException);
  });

  it('should create firmware if SHA-256 checksum is valid', async () => {
    const validChecksum = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const validDto: any = {
      version: 'v2.5.0',
      releaseName: 'Release 2.5',
      checksum: validChecksum,
      size: 5000000,
      releaseDate: '2026-07-28T00:00:00.000Z',
      supportedModels: ['MODEL_S'],
    };

    prismaMock.firmware.findUnique.mockResolvedValue(null);
    prismaMock.firmware.create.mockResolvedValue({
      id: 'fw-123',
      ...validDto,
      size: BigInt(5000000),
      createdAt: new Date(),
    });

    const result = await service.createFirmware(validDto);
    expect(result.statusCode).toBe(201);
    expect(result.data.version).toBe('v2.5.0');
  });
});
