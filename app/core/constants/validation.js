/**
 * Validation constants for alarms and passwords.
 * Used by domain validation and forms.
 */

// Time bounds (24h)
export const HOUR_MIN = 0;
export const HOUR_MAX = 23;
export const MINUTE_MIN = 0;
export const MINUTE_MAX = 59;

// Password rules
export const PASSWORD_MIN_LENGTH = 4;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_WHITESPACE_REGEX = /^\s*$/;

// Repeat days: 7 bits, bit 0 = Monday ... bit 6 = Sunday
export const REPEAT_DAY_BITS = 7;
export const REPEAT_MASK_MAX = (1 << REPEAT_DAY_BITS) - 1; // 127
