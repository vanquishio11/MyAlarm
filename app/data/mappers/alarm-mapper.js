/**
 * Map between DB rows (snake_case) and domain Alarm entity (camelCase).
 */

/**
 * @param {Record<string, unknown>} row - DB row
 * @returns {import('../../domain/entities/alarm.js').Alarm}
 */
export function rowToAlarm(row) {
  return {
    id: String(row.id),
    label: row.label != null ? String(row.label) : null,
    hour: Number(row.hour),
    minute: Number(row.minute),
    isEnabled: Boolean(Number(row.is_enabled)),
    repeatDays: Number(row.repeat_days),
    ringtoneUri: row.ringtone_uri != null ? String(row.ringtone_uri) : null,
    vibrate: Boolean(Number(row.vibrate)),
    snoozeMinutes:
      row.snooze_minutes != null ? Number(row.snooze_minutes) : null,
    passwordHash: String(row.password_hash),
    passwordSalt: String(row.password_salt),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * @param {import('../../domain/entities/alarm.js').Alarm} alarm
 * @returns {Record<string, unknown>} DB params
 */
export function alarmToRow(alarm) {
  return {
    id: alarm.id,
    label: alarm.label ?? null,
    hour: alarm.hour,
    minute: alarm.minute,
    is_enabled: alarm.isEnabled ? 1 : 0,
    repeat_days: alarm.repeatDays,
    ringtone_uri: alarm.ringtoneUri ?? null,
    vibrate: alarm.vibrate ? 1 : 0,
    snooze_minutes: alarm.snoozeMinutes ?? null,
    password_hash: alarm.passwordHash,
    password_salt: alarm.passwordSalt,
    created_at: alarm.createdAt,
    updated_at: alarm.updatedAt,
  };
}
