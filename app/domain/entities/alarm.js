/**
 * Alarm entity and repeat_days bitmask helpers.
 * Domain-only; no DB or UI imports.
 */

import { isDayEnabled, setDayInMask, bitIndexToJsDay } from "../../core/utils/time.js";
import { REPEAT_MASK_MAX } from "../../core/constants/validation.js";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * @typedef {Object} Alarm
 * @property {string} id
 * @property {string|null} label
 * @property {number} hour
 * @property {number} minute
 * @property {boolean} isEnabled
 * @property {number} repeatDays
 * @property {string|null} ringtoneUri
 * @property {boolean} vibrate
 * @property {number|null} snoozeMinutes
 * @property {string} passwordHash
 * @property {string} passwordSalt
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * @param {number} repeatDays - 7-bit mask
 * @returns {number[]} JS day numbers (0=Sun .. 6=Sat) that are set
 */
export function getRepeatDaysAsJsDays(repeatDays) {
  const out = [];
  for (let bit = 0; bit < 7; bit++) {
    const jsDay = bitIndexToJsDay(bit);
    if (isDayEnabled(repeatDays, jsDay)) out.push(jsDay);
  }
  return out;
}

/**
 * @param {number} repeatDays - 7-bit mask
 * @returns {string} e.g. "Mon, Wed, Sun" or "One-time"
 */
export function formatRepeatSummary(repeatDays) {
  if (!repeatDays || repeatDays === 0) return "One-time";
  const names = [];
  for (let bit = 0; bit < 7; bit++) {
    if ((repeatDays >> bit) & 1) names.push(DAY_NAMES[bit]);
  }
  return names.join(", ");
}

/**
 * Build repeat_days from array of JS day numbers (0-6).
 * @param {number[]} jsDays
 * @returns {number}
 */
export function repeatDaysFromJsDays(jsDays) {
  let mask = 0;
  for (const d of jsDays) {
    mask = setDayInMask(mask, d, true);
  }
  return mask & REPEAT_MASK_MAX;
}

/**
 * Clamp repeat_days to valid 7-bit range.
 * @param {number} repeatDays
 * @returns {number}
 */
export function clampRepeatDays(repeatDays) {
  return Math.max(0, Math.min(REPEAT_MASK_MAX, Math.floor(repeatDays)));
}

export { DAY_NAMES };
