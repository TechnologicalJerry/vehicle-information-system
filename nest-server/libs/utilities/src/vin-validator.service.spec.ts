import { VinValidatorService } from './vin-validator.service';
import { BadRequestException } from '@nestjs/common';

describe('VinValidatorService', () => {
  let service: VinValidatorService;

  beforeEach(() => {
    service = new VinValidatorService();
  });

  it('should validate a valid 17-character VIN with correct checksum', () => {
    // 1HGCR2F85HA000000 -> Check digit '5' at position 9
    const validVin = '1HGCR2F85HA000000';
    expect(() => service.validateVin(validVin)).not.toThrow();
  });

  it('should throw BadRequestException if VIN length is not 17', () => {
    expect(() => service.validateVin('1HGCR2F83HA00')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException if VIN contains disallowed characters I, O, Q', () => {
    expect(() => service.validateVin('1HGCR2F83HA00000I')).toThrow(BadRequestException);
  });

  it('should extract correct model year from VIN position 10', () => {
    const vin = '1HGCR2F83HA000000'; // Position 10 is 'H' -> 2017
    const year = service.extractModelYear(vin);
    expect(year).toBe(2017);
  });

  it('should extract correct country code from VIN position 1', () => {
    const vin = '1HGCR2F83HA000000'; // Position 1 is '1' -> USA
    const country = service.extractCountryCode(vin);
    expect(country).toBe('USA');
  });
});
