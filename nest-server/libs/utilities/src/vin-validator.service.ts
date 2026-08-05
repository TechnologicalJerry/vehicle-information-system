import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class VinValidatorService {
  private readonly LETTER_WEIGHTS: Record<string, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    J: 1,
    K: 2,
    L: 3,
    M: 4,
    N: 5,
    P: 7,
    R: 9,
    S: 2,
    T: 3,
    U: 4,
    V: 5,
    W: 6,
    X: 7,
    Y: 8,
    Z: 9,
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
  };

  private readonly POSITION_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  validateVin(vin: string): boolean {
    if (!vin || vin.length !== 17) {
      throw new BadRequestException('VIN must be exactly 17 characters long');
    }

    const uppercaseVin = vin.toUpperCase();

    // Disallowed characters according to ISO 3779 (I, O, Q)
    if (/[IOQ]/.test(uppercaseVin)) {
      throw new BadRequestException('Invalid VIN character: I, O, and Q are not allowed');
    }

    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(uppercaseVin)) {
      throw new BadRequestException('VIN contains invalid characters');
    }

    // Checksum calculation (Position 9 is check digit)
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const char = uppercaseVin.charAt(i);
      const value = this.LETTER_WEIGHTS[char];
      sum += value * this.POSITION_WEIGHTS[i];
    }

    const remainder = sum % 11;
    const expectedCheckDigit = remainder === 10 ? 'X' : remainder.toString();
    const actualCheckDigit = uppercaseVin.charAt(8);

    if (expectedCheckDigit !== actualCheckDigit) {
      throw new BadRequestException(
        `Invalid VIN checksum digit: Expected '${expectedCheckDigit}', found '${actualCheckDigit}'`,
      );
    }

    return true;
  }

  extractModelYear(vin: string): number {
    const yearChar = vin.charAt(9).toUpperCase();
    const yearMap: Record<string, number> = {
      A: 2010,
      B: 2011,
      C: 2012,
      D: 2013,
      E: 2014,
      F: 2015,
      G: 2016,
      H: 2017,
      J: 2018,
      K: 2019,
      L: 2020,
      M: 2021,
      N: 2022,
      P: 2023,
      R: 2024,
      S: 2025,
      T: 2026,
      V: 2027,
      W: 2028,
      X: 2029,
      Y: 2030,
      1: 2001,
      2: 2002,
      3: 2003,
      4: 2004,
      5: 2005,
      6: 2006,
      7: 2007,
      8: 2008,
      9: 2009,
    };
    return yearMap[yearChar] || 2024;
  }

  extractCountryCode(vin: string): string {
    const firstChar = vin.charAt(0).toUpperCase();
    if (['1', '4', '5'].includes(firstChar)) return 'USA';
    if (['2'].includes(firstChar)) return 'Canada';
    if (['3'].includes(firstChar)) return 'Mexico';
    if (['J'].includes(firstChar)) return 'Japan';
    if (['K'].includes(firstChar)) return 'South Korea';
    if (['S'].includes(firstChar)) return 'United Kingdom';
    if (['W'].includes(firstChar)) return 'Germany';
    if (['Z'].includes(firstChar)) return 'Italy';
    return 'Global';
  }
}
