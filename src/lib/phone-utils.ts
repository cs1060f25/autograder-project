/**
 * Phone number utilities for validation and formatting
 * Supports E.164 format and country-specific validation
 */

export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  format?: string; // Example: (XXX) XXX-XXXX
}

// Common country codes
export const COUNTRY_CODES: CountryCode[] = [
  { code: "US", name: "United States", dialCode: "+1", format: "(XXX) XXX-XXXX" },
  { code: "CA", name: "Canada", dialCode: "+1", format: "(XXX) XXX-XXXX" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", format: "XXXX XXXXXX" },
  { code: "AU", name: "Australia", dialCode: "+61", format: "XXXX XXX XXX" },
  { code: "IN", name: "India", dialCode: "+91", format: "XXXXX XXXXX" },
  { code: "CN", name: "China", dialCode: "+86", format: "XXX XXXX XXXX" },
  { code: "JP", name: "Japan", dialCode: "+81", format: "XX-XXXX-XXXX" },
  { code: "DE", name: "Germany", dialCode: "+49", format: "XXX XXXXXXX" },
  { code: "FR", name: "France", dialCode: "+33", format: "X XX XX XX XX" },
  { code: "BR", name: "Brazil", dialCode: "+55", format: "(XX) XXXXX-XXXX" },
  { code: "MX", name: "Mexico", dialCode: "+52", format: "XXX XXX XXXX" },
];

/**
 * Validates a phone number in E.164 format
 * E.164 format: +[country code][subscriber number]
 * Example: +14155552671
 */
export function validateE164PhoneNumber(phoneNumber: string): {
  isValid: boolean;
  error?: string;
} {
  if (!phoneNumber) {
    return { isValid: false, error: "Phone number is required" };
  }

  // Remove all whitespace
  const cleaned = phoneNumber.replace(/\s/g, "");

  // Check if it starts with +
  if (!cleaned.startsWith("+")) {
    return { isValid: false, error: "Phone number must start with +" };
  }

  // Check if it contains only digits after the +
  const digitsOnly = cleaned.slice(1);
  if (!/^\d+$/.test(digitsOnly)) {
    return { isValid: false, error: "Phone number can only contain digits after +" };
  }

  // E.164 allows 1-15 digits after the +
  if (digitsOnly.length < 1 || digitsOnly.length > 15) {
    return { isValid: false, error: "Phone number must be between 1 and 15 digits" };
  }

  return { isValid: true };
}

/**
 * Formats a phone number based on country code
 */
export function formatPhoneNumber(phoneNumber: string, countryCode: string): string {
  if (!phoneNumber) return "";

  const country = COUNTRY_CODES.find((c) => c.code === countryCode);
  if (!country) return phoneNumber;

  // Remove country dial code and any non-digits
  const dialCode = country.dialCode;
  let digits = phoneNumber.replace(/\D/g, "");
  
  // Remove leading country code if present
  if (digits.startsWith(dialCode.replace("+", ""))) {
    digits = digits.slice(dialCode.replace("+", "").length);
  }

  // Apply format if available
  if (country.format) {
    let formatted = country.format;
    for (const digit of digits) {
      formatted = formatted.replace("X", digit);
    }
    // Remove remaining X's
    formatted = formatted.replace(/X/g, "");
    return formatted.trim();
  }

  return phoneNumber;
}

/**
 * Masks a phone number for display (shows only last 4 digits)
 * Example: +14155552671 -> •••• •••• 2671
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return "";

  // Remove all non-digits except the leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, "");
  
  // Get last 4 digits
  const lastFour = cleaned.slice(-4);
  
  // Return masked version
  return `•••• •••• ${lastFour}`;
}

/**
 * Converts a phone number to E.164 format
 */
export function toE164Format(phoneNumber: string, countryCode: string): string {
  if (!phoneNumber) return "";

  const country = COUNTRY_CODES.find((c) => c.code === countryCode);
  if (!country) return phoneNumber;

  // Remove all non-digits
  let digits = phoneNumber.replace(/\D/g, "");

  // If it already starts with the country code, don't add it again
  const countryDigits = country.dialCode.replace("+", "");
  if (digits.startsWith(countryDigits)) {
    return "+" + digits;
  }

  // Add country code
  return country.dialCode + digits;
}

/**
 * Validates phone number length for specific country
 */
export function validatePhoneLength(phoneNumber: string, countryCode: string): {
  isValid: boolean;
  error?: string;
} {
  const digits = phoneNumber.replace(/\D/g, "");
  
  // Country-specific length validation
  const lengthRules: Record<string, { min: number; max: number }> = {
    US: { min: 10, max: 10 },
    CA: { min: 10, max: 10 },
    GB: { min: 10, max: 10 },
    AU: { min: 9, max: 9 },
    IN: { min: 10, max: 10 },
    CN: { min: 11, max: 11 },
    JP: { min: 10, max: 10 },
    DE: { min: 10, max: 11 },
    FR: { min: 9, max: 9 },
    BR: { min: 10, max: 11 },
    MX: { min: 10, max: 10 },
  };

  const rule = lengthRules[countryCode];
  if (!rule) {
    // Default validation for unknown countries
    if (digits.length < 7 || digits.length > 15) {
      return { isValid: false, error: "Phone number length is invalid" };
    }
    return { isValid: true };
  }

  // Remove country code if present for length check
  const country = COUNTRY_CODES.find((c) => c.code === countryCode);
  let localDigits = digits;
  if (country) {
    const countryDigits = country.dialCode.replace("+", "");
    if (digits.startsWith(countryDigits)) {
      localDigits = digits.slice(countryDigits.length);
    }
  }

  if (localDigits.length < rule.min) {
    return { isValid: false, error: `Phone number is too short (minimum ${rule.min} digits)` };
  }

  if (localDigits.length > rule.max) {
    return { isValid: false, error: `Phone number is too long (maximum ${rule.max} digits)` };
  }

  return { isValid: true };
}
