/**
 * Time utilities: ISO timestamps, repeat-day helpers.
 * Used by domain scheduling and persistence.
 */

/**
 * @returns {string} Current time in ISO 8601 UTC
 */
export function nowISO() {
  return new Date().toISOString();
}

/**
 * Day of week: 0 = Sunday, 1 = Monday, ... 6 = Saturday (JS getDay())
 * Our bitmask: bit 0 = Monday, bit 6 = Sunday.
 * @param {number} jsDay - getDay() result
 * @returns {number} Bit index 0..6 (Monday=0, Sunday=6)
 */
export function jsDayToBitIndex(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * @param {number} bitIndex 0..6
 * @returns {number} JS getDay() (0=Sun .. 6=Sat)
 */
export function bitIndexToJsDay(bitIndex) {
  return bitIndex === 6 ? 0 : bitIndex + 1;
}

/**
 * Is the given day (JS getDay()) set in the repeat_days bitmask?
 * @param {number} repeatDays - 7-bit mask
 * @param {number} jsDay - 0-6
 * @returns {boolean}
 */
export function isDayEnabled(repeatDays, jsDay) {
  const bit = jsDayToBitIndex(jsDay);
  return ((repeatDays >> bit) & 1) === 1;
}

/**
 * Set or clear a day in the bitmask.
 * @param {number} repeatDays - current mask
 * @param {number} jsDay - 0-6
 * @param {boolean} enabled
 * @returns {number} new mask
 */
export function setDayInMask(repeatDays, jsDay, enabled) {
  const bit = jsDayToBitIndex(jsDay);
  if (enabled) return repeatDays | (1 << bit);
  return repeatDays & ~(1 << bit);
}
