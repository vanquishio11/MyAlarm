/**
 * Alarm CRUD. All methods take a db instance (from useSQLiteContext or openDb).
 */

import { NotFoundError } from "../../core/errors.js";
import { nowISO } from "../../core/utils/time.js";
import { rowToAlarm, alarmToRow } from "../mappers/alarm-mapper.js";

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {Object} alarmDraft - id, hour, minute, passwordHash, passwordSalt, and optional fields
 * @returns {Promise<import('../../domain/entities/alarm.js').Alarm>}
 */
export async function createAlarm(db, alarmDraft) {
  const now = nowISO();
  const alarm = {
    id: alarmDraft.id,
    label: alarmDraft.label ?? null,
    hour: alarmDraft.hour,
    minute: alarmDraft.minute,
    isEnabled: alarmDraft.isEnabled ?? true,
    repeatDays: alarmDraft.repeatDays ?? 0,
    ringtoneUri: alarmDraft.ringtoneUri ?? null,
    vibrate: alarmDraft.vibrate ?? true,
    snoozeMinutes: alarmDraft.snoozeMinutes ?? null,
    passwordHash: alarmDraft.passwordHash,
    passwordSalt: alarmDraft.passwordSalt,
    createdAt: now,
    updatedAt: now,
  };
  const row = alarmToRow(alarm);
  await db.runAsync(
    `INSERT INTO alarms (
      id, label, hour, minute, is_enabled, repeat_days,
      ringtone_uri, vibrate, snooze_minutes, password_hash, password_salt,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id,
    row.label,
    row.hour,
    row.minute,
    row.is_enabled,
    row.repeat_days,
    row.ringtone_uri,
    row.vibrate,
    row.snooze_minutes,
    row.password_hash,
    row.password_salt,
    row.created_at,
    row.updated_at
  );
  return alarm;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} alarmId
 * @param {Object} patch - fields to update (camelCase); updatedAt set automatically
 * @returns {Promise<import('../../domain/entities/alarm.js').Alarm>}
 */
export async function updateAlarm(db, alarmId, patch) {
  const existing = await getAlarm(db, alarmId);
  const updated = {
    ...existing,
    ...patch,
    id: alarmId,
    updatedAt: nowISO(),
  };
  const row = alarmToRow(updated);
  await db.runAsync(
    `UPDATE alarms SET
      label = ?, hour = ?, minute = ?, is_enabled = ?, repeat_days = ?,
      ringtone_uri = ?, vibrate = ?, snooze_minutes = ?,
      password_hash = ?, password_salt = ?,
      updated_at = ?
    WHERE id = ?`,
    row.label,
    row.hour,
    row.minute,
    row.is_enabled,
    row.repeat_days,
    row.ringtone_uri,
    row.vibrate,
    row.snooze_minutes,
    row.password_hash,
    row.password_salt,
    row.updated_at,
    alarmId
  );
  return updated;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} alarmId
 */
export async function deleteAlarm(db, alarmId) {
  await db.runAsync("DELETE FROM alarms WHERE id = ?", alarmId);
  await db.runAsync("DELETE FROM alarm_schedule_mapping WHERE alarm_id = ?", alarmId);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @returns {Promise<import('../../domain/entities/alarm.js').Alarm[]>}
 */
export async function listAlarms(db) {
  const rows = await db.getAllAsync(
    "SELECT * FROM alarms ORDER BY updated_at DESC"
  );
  return rows.map(rowToAlarm);
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} alarmId
 * @returns {Promise<import('../../domain/entities/alarm.js').Alarm>}
 */
export async function getAlarm(db, alarmId) {
  const row = await db.getFirstAsync("SELECT * FROM alarms WHERE id = ?", alarmId);
  if (!row) throw new NotFoundError("Alarm", alarmId);
  return rowToAlarm(row);
}
