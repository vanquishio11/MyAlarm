-- Reference schema (see migrations for applied DDL)
-- Schema version: 1

CREATE TABLE alarms (
  id TEXT PRIMARY KEY,
  label TEXT,
  hour INTEGER NOT NULL CHECK(hour >= 0 AND hour <= 23),
  minute INTEGER NOT NULL CHECK(minute >= 0 AND minute <= 59),
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK(is_enabled IN (0, 1)),
  repeat_days INTEGER NOT NULL DEFAULT 0,
  ringtone_uri TEXT,
  vibrate INTEGER NOT NULL DEFAULT 1 CHECK(vibrate IN (0, 1)),
  snooze_minutes INTEGER CHECK(snooze_minutes IS NULL OR snooze_minutes > 0),
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_alarms_enabled ON alarms(is_enabled);
CREATE INDEX idx_alarms_updated ON alarms(updated_at);

CREATE TABLE alarm_schedule_mapping (
  alarm_id TEXT PRIMARY KEY REFERENCES alarms(id) ON DELETE CASCADE,
  os_schedule_id TEXT NOT NULL,
  scheduled_at TEXT
);

CREATE TABLE schema_version (version INTEGER NOT NULL);
