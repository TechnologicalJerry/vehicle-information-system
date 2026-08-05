import { v4 as uuidv4, validate as validateUuid } from 'uuid';

export class UuidUtility {
  static generate(): string {
    return uuidv4();
  }

  static isValid(uuid: string): boolean {
    return validateUuid(uuid);
  }
}
