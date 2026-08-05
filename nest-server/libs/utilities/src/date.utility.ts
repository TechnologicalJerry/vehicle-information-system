export class DateUtility {
  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  static addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
  }

  static isExpired(expirationDate: Date): boolean {
    return new Date() > expirationDate;
  }
}
