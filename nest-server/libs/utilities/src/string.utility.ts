export class StringUtility {
  static capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static maskVin(vin: string): string {
    if (!vin || vin.length < 8) return vin;
    return `${vin.substring(0, 3)}****${vin.substring(vin.length - 4)}`;
  }
}
