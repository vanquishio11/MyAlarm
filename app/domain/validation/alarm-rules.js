/**
 * Alarm and password validation rules.
 * Throws ValidationError on failure.
 */

import {
  HOUR_MIN,
  HOUR_MAX,
  MINUTE_MIN,
  MINUTE_MAX,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_WHITESPACE_REGEX,
  REPEAT_MASK_MAX,
} from "../../core/constants/validation.js";
import { ValidationError } from "../../core/errors.js";
import { clampRepeatDays } from "../entities/alarm.js";

export function validateHour(hour, fieldName = "hour") {
  const n = Number(hour);
  if (!Number.isInteger(n) || n < HOUR_MIN || n > HOUR_MAX) {
    throw new ValidationError(
      `Hour must be between ${HOUR_MIN} and ${HOUR_MAX}`,
      fieldName
    );
  }
  return n;
}

export function validateMinute(minute, fieldName = "minute") {
  const n = Number(minute);
  if (!Number.isInteger(n) || n < MINUTE_MIN || n > MINUTE_MAX) {
    throw new ValidationError(
      `Minute must be between ${MINUTE_MIN} and ${MINUTE_MAX}`,
      fieldName
    );
  }
  return n;
}

export function validatePassword(password, fieldName = "password") {
  if (typeof password !== "string") {
    throw new ValidationError("Password must be a string", fieldName);
  }
  const trimmed = password.trim();
  if (PASSWORD_WHITESPACE_REGEX.test(password) || trimmed.length === 0) {
    throw new ValidationError("Password cannot be empty or whitespace only", fieldName);
  }
  if (trimmed.length < PASSWORD_MIN_LENGTH) {
    throw new ValidationError(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      fieldName
    );
  }
  if (trimmed.length > PASSWORD_MAX_LENGTH) {
    throw new ValidationError(
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
      fieldName
    );
  }
  return trimmed;
}

export function validateRepeatDays(repeatDays) {
  const n = Number(repeatDays);
  if (!Number.isInteger(n) || n < 0 || n > REPEAT_MASK_MAX) {
    throw new ValidationError("Invalid repeat days mask", "repeatDays");
  }
  return clampRepeatDays(n);
}

export function validateSnoozeMinutes(snoozeMinutes) {
  if (snoozeMinutes == null) return null;
  const n = Number(snoozeMinutes);
  if (!Number.isInteger(n) || n <= 0) {
    throw new ValidationError("Snooze minutes must be a positive integer or empty", "snoozeMinutes");
  }
  return n;
}

/**
 * Validate alarm draft for create/update (time + optional password for create).
 * Does not validate password hash/salt (handled by PasswordGate + form).
 */
export function validateAlarmDraft(draft) {
  const hour = validateHour(draft.hour);
  const minute = validateMinute(draft.minute);
  const repeatDays = validateRepeatDays(draft.repeatDays ?? 0);
  const snoozeMinutes = validateSnoozeMinutes(draft.snoozeMinutes ?? null);
  return {
    hour,
    minute,
    repeatDays,
    snoozeMinutes,
    label: draft.label != null ? String(draft.label).trim() || null : null,
    ringtoneUri: draft.ringtoneUri != null ? String(draft.ringtoneUri) : null,
    vibrate: Boolean(draft.vibrate),
    isEnabled: Boolean(draft.isEnabled),
  };
}
