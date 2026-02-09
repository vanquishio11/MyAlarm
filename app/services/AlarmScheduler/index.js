/**
 * Schedules and cancels OS-level alarm notifications.
 * Uses expo-notifications and stores alarmId -> notificationId in alarm_schedule_mapping.
 */

import * as Notifications from "expo-notifications";
import { getNextTrigger } from "../../domain/scheduling/next-trigger.js";

// So notifications show when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {import('../../domain/entities/alarm.js').Alarm} alarm
 * @returns {Promise<string>} notification id (os_schedule_id)
 */
export async function scheduleAlarm(db, alarm) {
  if (!alarm.isEnabled) return null;
  const triggerDate = getNextTrigger({
    hour: alarm.hour,
    minute: alarm.minute,
    repeatDays: alarm.repeatDays,
  });
  const title = alarm.label || "Alarm";
  const body = formatTime(alarm.hour, alarm.minute);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { alarmId: alarm.id },
      sound: true,
    },
    trigger: { date: triggerDate, channelId: "alarm" },
  });
  await db.runAsync(
    `INSERT OR REPLACE INTO alarm_schedule_mapping (alarm_id, os_schedule_id, scheduled_at) VALUES (?, ?, ?)`,
    alarm.id,
    id,
    triggerDate.toISOString()
  );
  return id;
}

/**
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {string} alarmId
 */
export async function cancelAlarm(db, alarmId) {
  const row = await db.getFirstAsync(
    "SELECT os_schedule_id FROM alarm_schedule_mapping WHERE alarm_id = ?",
    alarmId
  );
  if (row?.os_schedule_id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(row.os_schedule_id);
    } catch (_) {}
    await db.runAsync("DELETE FROM alarm_schedule_mapping WHERE alarm_id = ?", alarmId);
  }
}

/**
 * Reschedule all enabled alarms (e.g. on app start or after reboot).
 * @param {import('expo-sqlite').SQLiteDatabase} db
 * @param {import('../../domain/entities/alarm.js').Alarm[]} alarms - pass list from repository
 */
export async function rescheduleAll(db, alarms) {
  const enabled = alarms.filter((a) => a.isEnabled);
  for (const alarm of enabled) {
    await cancelAlarm(db, alarm.id);
    await scheduleAlarm(db, alarm);
  }
}

function formatTime(hour, minute) {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}
