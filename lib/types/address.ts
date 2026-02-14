/**
 * Structured address types for the application
 * Used to ensure consistent address handling across all addresses (user profiles, orders, prescriptions)
 */

/**
 * A properly structured address with all required components
 * Postal code is optional
 * Used for user profiles, shipping addresses, billing addresses, and practice addresses
 */
export interface StructuredAddress {
  streetLine1: string;
  streetLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  country: string;
}

/**
 * Database representation of address fields
 * Maps to actual database column names for type safety
 * Postal code is optional
 */
export interface AddressDBFields {
  street_line_1: string;
  street_line_2?: string | null;
  city: string;
  state: string;
  postal_code?: string | null;
  country: string;
}

/**
 * User profile address fields (from user_profiles table)
 */
export interface UserProfileAddress extends StructuredAddress {}

/**
 * Shipping address type for orders
 */
export interface ShippingAddress extends StructuredAddress {}

/**
 * Billing address type for orders
 */
export interface BillingAddress extends StructuredAddress {}

/**
 * Practice address type for prescriptions
 */
export interface PracticeAddress extends StructuredAddress {}

/**
 * Convert database address fields to StructuredAddress
 * @param dbFields Database fields from table
 * @param prefix Column prefix (e.g., 'shipping_', 'billing_', 'practice_', '')
 * @returns Structured address object
 */
export function dbFieldsToStructuredAddress(
  data: Record<string, any>,
  prefix: string = ''
): StructuredAddress | null {
  const streetLine1 = data[`${prefix}street_line_1`] || data[`${prefix}street_1`] || data[`${prefix}address_line_1`];
  const streetLine2 = data[`${prefix}street_line_2`] || data[`${prefix}street_2`] || data[`${prefix}address_line_2`];
  const city = data[`${prefix}city`];
  const state = data[`${prefix}state`];
  const postalCode = data[`${prefix}postal_code`] || data[`${prefix}zip`];
  const country = data[`${prefix}country`];

  if (!streetLine1 || !city || !state || !postalCode || !country) {
    return null;
  }

  return {
    streetLine1,
    streetLine2: streetLine2 || undefined,
    city,
    state,
    postalCode,
    country,
  };
}

/**
 * Convert StructuredAddress to database field format
 * @param address Structured address object
 * @param prefix Column prefix for database (e.g., 'shipping_', 'billing_', etc.)
 * @returns Object ready for database insert/update
 */
export function structuredAddressToDBFields(
  address: StructuredAddress | null | undefined,
  prefix: string = ''
): Record<string, any> {
  if (!address) {
    return {};
  }

  const result: Record<string, any> = {};
  result[`${prefix}street_line_1`] = address.streetLine1;
  result[`${prefix}street_line_2`] = address.streetLine2 || null;
  result[`${prefix}city`] = address.city;
  result[`${prefix}state`] = address.state;
  result[`${prefix}postal_code`] = address.postalCode;
  result[`${prefix}country`] = address.country;

  return result;
}

/**
 * Format an address for display/printing
 * @param address Structured address
 * @returns Human-readable address string
 */
export function formatAddressForDisplay(address: StructuredAddress | null | undefined): string {
  if (!address) {
    return '';
  }

  const lines: string[] = [];

  if (address.streetLine1) {
    lines.push(address.streetLine1);
  }

  if (address.streetLine2) {
    lines.push(address.streetLine2);
  }

  if (address.city || address.state || address.postalCode) {
    const cityStateZip = [address.city, address.state, address.postalCode]
      .filter(Boolean)
      .join(', ');
    lines.push(cityStateZip);
  }

  if (address.country) {
    lines.push(address.country);
  }

  return lines.join('\n');
}

/**
 * Validate that all required address fields are present
 * Postal code is optional, all others are required
 * @param address Address to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: any): address is StructuredAddress {
  return (
    address &&
    typeof address.streetLine1 === 'string' &&
    address.streetLine1.trim().length > 0 &&
    typeof address.city === 'string' &&
    address.city.trim().length > 0 &&
    typeof address.state === 'string' &&
    address.state.trim().length > 0 &&
    typeof address.country === 'string' &&
    address.country.trim().length > 0 &&
    (!address.postalCode || (typeof address.postalCode === 'string' && address.postalCode.trim().length >= 0))
  );
}
