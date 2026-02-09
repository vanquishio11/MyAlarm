/**
 * Pure: compute next trigger timestamp from alarm + current time.
 * Used by AlarmScheduler. No side effects.
 */

import { isDayEnabled } from "../../core/utils/time.js";

/**
 * Get next trigger Date for this alarm from a given "now".
 * - If repeatDays set: next matching weekday at alarm time (today or later).
 * - Else: if alarm time today has passed, tomorrow same time; else today.
 * All in local time (no timezone shift here; caller may pass in local "now").
 *
 * @param {{ hour: number, minute: number, repeatDays: number }} alarm - hour/minute 24h, repeatDays bitmask
 * @param {Date} from - reference time (e.g. now)
 * @returns {Date} next trigger
 */
export function getNextTrigger(alarm, from = new Date()) {
  const { hour, minute, repeatDays } = alarm;
  const fromYear = from.getFullYear();
  const fromMonth = from.getMonth();
  const fromDate = from.getDate();
  const fromDay = from.getDay(); // 0 Sun .. 6 Sat

  const today = new Date(fromYear, fromMonth, fromDate, hour, minute, 0, 0);

  if (repeatDays === 0) {
    // One-time: next occurrence is today or tomorrow
    if (from.getTime() < today.getTime()) {
      return today;
    }
    const tomorrow = new Date(fromYear, fromMonth, fromDate + 1, hour, minute, 0, 0);
    return tomorrow;
  }

  // Repeating: find next day (starting from today) that is in repeat_days
  let check = new Date(fromYear, fromMonth, fromDate, hour, minute, 0, 0);
  const maxDays = 8; // avoid infinite loop
  for (let i = 0; i < maxDays; i++) {
    const day = check.getDay();
    if (isDayEnabled(repeatDays, day)) {
      if (check.getTime() > from.getTime()) {
        return check;
      }
    }
    check.setDate(check.getDate() + 1);
  }
  // Fallback: next week same day
  return new Date(fromYear, fromMonth, fromDate + 7, hour, minute, 0, 0);
}
