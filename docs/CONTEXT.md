# Alarm App — Time Wheel + Per-Alarm Password Gate

Implementation plan: CRUD alarms, sliding time picker, and password-protected dismiss/disable.

---

## Goals

1. **Alarm CRUD** — Add, edit, and delete alarms from a single “Alarms” page (app entry).
2. **Time selection** — Sliding time wheel (picker) for setting alarm time.
3. **Per-alarm password** — User cannot turn off or dismiss an alarm without the correct password for that alarm.

---

## 00 — Requirements

### Functional

- App opens to **Alarms** page listing all alarms.
- User can **Add**, **Edit**, and **Delete** alarms.
- Alarm time is chosen with a **sliding time wheel** (hour/minute; optional AM/PM).
- Each alarm has a **password**; dismiss/disable requires that password.
- Alarm can be **enabled/disabled** from the list; disabling requires password.
- When alarm fires: **full-screen ring UI** + audio/vibration.
- **Snooze** (optional): decide whether snooze also requires password.

### Non-functional

- Reliable in background (OS-appropriate scheduling).
- Password handling is secure (never store plain text).
- Accessible UI (screen readers; large touch targets).

---

## 01 — Architecture

Clear separation of concerns:

| Layer | Responsibility |
|-------|----------------|
| **UI** | Screens/components: Alarms list, Alarm form, Ring screen. |
| **Domain** | Alarm entity, validation rules, scheduling rules. |
| **Data** | Local persistence, password hashing, migrations. |

### Services

- **AlarmScheduler** — Schedules/cancels OS alarms/notifications.
- **AlarmRinger** — Ringing, sound, vibration, volume policies.
- **PasswordGate** — Verifies user input against stored hash.

### State

- ViewModels/store for reactive updates.

---

## Database Schema (full)

Target: **SQLite** (same concepts apply to Room/CoreData/Realm). Single DB file with versioned migrations.

### Tables

#### `alarms`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | UUID (e.g. `uuid4`) |
| `label` | TEXT | nullable | User-facing name |
| `hour` | INTEGER | NOT NULL, CHECK(0–23) | 24h format preferred |
| `minute` | INTEGER | NOT NULL, CHECK(0–59) | |
| `is_enabled` | INTEGER | NOT NULL, CHECK(0/1) | 1 = enabled |
| `repeat_days` | INTEGER | NOT NULL, DEFAULT 0 | Bitmask: see below |
| `ringtone_uri` | TEXT | nullable | Asset or file URI |
| `vibrate` | INTEGER | NOT NULL, DEFAULT 1, CHECK(0/1) | |
| `snooze_minutes` | INTEGER | nullable | Null = no snooze |
| `password_hash` | TEXT | NOT NULL | e.g. Argon2/bcrypt output |
| `password_salt` | TEXT | NOT NULL | Salt for hashing |
| `created_at` | TEXT | NOT NULL | ISO 8601 UTC |
| `updated_at` | TEXT | NOT NULL | ISO 8601 UTC |

**Repeat days bitmask** (7 bits, 0 = no repeat):  
Bit 0 = Monday … Bit 6 = Sunday.  
Example: `73` = Mon+Wed+Sun (1 + 4 + 68).  
Value `0` = one-time alarm (next occurrence only).

**Indexes:**

- `idx_alarms_enabled` on `(is_enabled)` — list enabled alarms for scheduling.
- `idx_alarms_updated` on `(updated_at)` — optional, for ordered lists.

#### `alarm_schedule_mapping` (optional, for cancellation)

Maps app alarm id to OS scheduler id so we can cancel the right trigger. Can be in-memory only if the OS API is process-bound; persist if needed after restart.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `alarm_id` | TEXT | PRIMARY KEY, FK → alarms(id) ON DELETE CASCADE | |
| `os_schedule_id` | TEXT | NOT NULL | Id from AlarmManager/UNUserNotification etc. |
| `scheduled_at` | TEXT | nullable | ISO 8601 next trigger (debug/display) |

#### `schema_version`

| Column | Type | Description |
|--------|------|-------------|
| `version` | INTEGER | Current schema version for migrations |

### Example DDL (SQLite)

```sql
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
INSERT INTO schema_version (version) VALUES (1);
```

### Migration strategy

- Bump `schema_version` for each change.
- Add migrations as numbered scripts (e.g. `001_initial.sql`, `002_add_snooze_default.sql`).
- On open: if `version < N`, run migrations in order; never store plaintext password in any migration.

---

## Folder Structure (optimal)

App root is `app/` (or `src/`). Layer-first to match UI / Domain / Data / Services.

```
app/
├── main.*                    # Entry point, DI wiring
├── app.*                     # Root widget / navigation
│
├── core/                     # Shared utilities, constants, extensions
│   ├── constants/
│   │   ├── validation.ts     # Min/max password length, hour/minute bounds
│   │   └── defaults.ts       # Default snooze, vibrate, etc.
│   ├── utils/
│   │   ├── time.ts           # Next trigger computation, repeat-day helpers
│   │   └── ids.ts            # UUID generation
│   └── errors.ts             # App error types
│
├── domain/                   # Entities and business rules
│   ├── entities/
│   │   └── alarm.ts          # Alarm type, repeat_days bitmask helpers
│   ├── validation/
│   │   └── alarm-rules.ts    # hour/minute, password rules
│   └── scheduling/
│       └── next-trigger.ts   # Pure: next trigger from alarm + now
│
├── data/                     # Persistence and external data
│   ├── db/
│   │   ├── schema.sql        # Or generated from ORM
│   │   ├── migrations/       # 001_initial.sql, 002_*.sql
│   │   └── connection.ts    # DB open, version check
│   ├── repositories/
│   │   └── alarm-repository.ts  # createAlarm, updateAlarm, deleteAlarm, listAlarms, getAlarm
│   └── mappers/
│       └── alarm-mapper.ts   # Row ↔ Alarm entity
│
├── services/                 # Side effects and OS integration
│   ├── AlarmScheduler/       # scheduleAlarm, cancelAlarm, rescheduleAllOnBootOrAppStart
│   │   └── index.ts
│   ├── AlarmRinger/          # start, stop, volume, vibration
│   │   └── index.ts
│   └── PasswordGate/         # hashPassword, verifyPassword (uses salt)
│       └── index.ts
│
├── state/                    # ViewModels / store (reactive state)
│   ├── alarms-store.ts       # List of alarms, selected alarm, loading
│   ├── ring-state.ts         # Currently ringing alarm, attempt count
│   └── schedule-cache.ts     # alarmId → osScheduleId (if persisted)
│
└── ui/                       # Screens and components
    ├── screens/
    │   ├── AlarmsScreen/     # List + add; entry screen
    │   │   ├── AlarmsScreen.tsx
    │   │   └── AlarmRow.tsx
    │   ├── AlarmFormScreen/  # Add/edit; time wheel + password section
    │   │   ├── AlarmFormScreen.tsx
    │   │   └── PasswordSection.tsx
    │   └── RingScreen/       # Full-screen ring + password entry + dismiss/snooze
    │       └── RingScreen.tsx
    ├── components/
    │   ├── TimeWheel/        # Hour/minute (and AM/PM) picker
    │   │   └── TimeWheel.tsx
    │   ├── RepeatDaysPicker/
    │   └── PasswordModal/    # "Enter password to disable"
    └── theme/                # Colors, typography, spacing
        └── index.ts
```

### Notes on structure

- **core/** — No UI or DB; used by domain, data, services, and UI.
- **domain/** — No imports from `data/` or `ui/`; keeps business logic testable.
- **data/** — DB and repositories only; repositories use `Alarm` from domain.
- **services/** — Call into data (e.g. repository) and OS APIs; used by state/screens.
- **state/** — Single place for app/list/ring state; screens read and dispatch actions.
- **ui/screens/** — One folder per main screen; **ui/components/** shared (TimeWheel, PasswordModal).

Use `*.ts`/`*.tsx` as placeholders; replace with `.kt`, `.swift`, `.dart` etc. for your stack. Same layout applies.

---

## 02 — Data Model

### Alarm entity (recommended fields)

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID/string | Unique identifier |
| `label` | string | Optional |
| `hour` | int | 0–23 or 1–12 |
| `minute` | int | 0–59 |
| `isEnabled` | bool | |
| `repeatDays` | bitmask/array | Optional: Mon–Sun |
| `ringtone` | string/uri | Optional |
| `vibrate` | bool | |
| `snoozeMinutes` | int | Optional |
| `passwordHash` | string | Hash only |
| `passwordSalt` | string | If algorithm needs it |
| `createdAt`, `updatedAt` | datetime | |

### Validation rules

- `hour` / `minute` in valid range.
- Password: min length (e.g. 4–6+), max length, no whitespace-only.
- `repeatDays` empty ⇒ one-time alarm or next-occurrence logic.

---

## 03 — Storage

### Implementation steps

1. **Persistence** — SQLite/Room/CoreData/Realm, or local KV + indexing.
2. **Passwords** — Store only `passwordHash` (+ salt if applicable); never plain text.
3. **CRUD**:
   - `createAlarm(alarmDraft)`
   - `updateAlarm(alarmId, patch)`
   - `deleteAlarm(alarmId)`
   - `listAlarms()`
   - `getAlarm(alarmId)`
4. **PasswordGate**:
   - `hashPassword(password)` → `(hash, salt)`
   - `verifyPassword(input, storedHash, salt)` → bool
5. **Migrations** — Versioning hooks for schema changes.

---

## 04 — UI: Alarms Page (app entry)

### Layout

- **Top bar**: title “Alarms” + Add (+) button.
- **List**: alarm cards/rows with:
  - Time (large), label, repeat summary
  - Toggle for enabled state
  - Edit tap area
  - Delete (swipe or overflow menu)

### Behaviors

- **Add** → opens Alarm Form (new alarm).
- **Tap row** → opens Alarm Form (edit).
- **Delete** → confirm; then cancel scheduled alarm.
- **Toggle ON** → schedule alarm immediately.
- **Toggle OFF** → require password gate for that alarm (see §09).

---

## 05 — UI: Sliding Time Wheel

### Requirements

- Separate wheels for **hour** and **minute** (and AM/PM if 12h).
- Snaps to values; selected value centered.
- Infinite-scroll feel (optional) or bounded scroll.
- Optional haptics/tick feedback.

### Data binding

- On scroll end → update selected hour/minute.
- When loading existing alarm → wheels jump to saved values.

### Accessibility

- Accessible labels (e.g. “Hour picker”, “Minute picker”).
- Optional direct input fallback for accessibility.

---

## 06 — UI: Alarm Form (add/edit)

### Fields

- Time wheel (hour/minute)
- Label (optional)
- Repeat days (optional)
- Sound / vibrate / snooze (optional)
- **Password**:
  - Set password (new) or change password (edit)
  - Confirm password field

### Actions

- **Save** (primary)
- **Cancel** / back

### Save logic

- Validate time and password rules.
- Hash password; store hash + salt.
- Persist alarm.
- If `isEnabled = true`, schedule next occurrence.

---

## 07 — Alarm Engine

### Functions

- **scheduleAlarm(alarm)** — Compute next trigger time; register with OS.
- **cancelAlarm(alarmId)** — Remove OS scheduled trigger.
- **rescheduleAllOnBootOrAppStart()** — Restore schedules after reboot/updates.

### Next trigger

- If `repeatDays` set → next matching day/time in the future.
- Else → if time today has passed → schedule for tomorrow.

### OS mapping

- Keep `alarmId` → `osScheduleId` so cancellation is reliable.

---

## 08 — Trigger Flow (when alarm fires)

1. OS triggers alarm event/notification.
2. App shows **Ring screen** (full screen if possible).
3. **AlarmRinger** starts audio/vibration and keeps device awake.
4. **Ring UI** shows:
   - Alarm time/label
   - Password entry
   - Dismiss (disabled until password correct, or triggers check)
   - Snooze (if allowed) — decide whether it requires password.
5. **Correct password** → stop ringer, update state, schedule next occurrence.
6. **Incorrect password** → show error and keep ringing.

---

## 09 — Password Gate

Used in two places:

- **A)** Turning alarm off from list (disable toggle).
- **B)** Dismissing alarm when it is ringing.

**Rule:** User cannot disable or dismiss without the correct password for that alarm.

### Disable toggle (from list)

1. User toggles OFF.
2. Modal: “Enter password to disable this alarm”.
3. If correct → set `isEnabled = false`, cancel schedule.
4. If incorrect/cancel → revert toggle to ON, keep schedule.

### Ring screen

1. User enters password.
2. Verify with `PasswordGate.verifyPassword()`.
3. If correct → `AlarmRinger.stop()`; mark handled; schedule next.
4. If wrong → show error; optionally rate-limit attempts.

### Security

- Never show stored password.
- Prefer constant-time compare where available.
- Optional: max attempts per ring session + cooldown.

---

## 10 — Edge Cases

| Scenario | Handling |
|----------|----------|
| Edit time while enabled | Reschedule immediately. |
| Delete enabled alarm | Cancel OS schedule first, then delete. |
| Multiple alarms close together | Queue ring screens or show next after dismissing current. |
| App killed / rebooted | `rescheduleAllOnBootOrAppStart()`. |
| Timezone/DST change | Recompute next trigger if OS provides hooks. |
| Password change | Require old password (recommended) or allow direct change. |
| Forgot password | Define reset policy; e.g. require device auth (biometric/OS lock) then allow reset. |

---

## 11 — Testing

### Unit

- Next-trigger computation (repeats + one-time).
- Password hashing/verification.
- Validation rules.

### Integration

- Create alarm → schedule called with correct timestamp.
- Edit enabled alarm → reschedule.
- Disable toggle → prompt password → cancel schedule only on success.

### UI

- Time wheel snaps and persists selection.
- Ring screen blocks dismiss until correct password.
- Incorrect password shows error and keeps ringing.

---

## 12 — Security

- Hash + salt passwords; no plaintext.
- Consider OS secure storage for hash/salt or encryption at rest.
- Rate-limit password attempts during ring session.
- Do not log passwords or raw user input.
- Debug builds must not bypass password gate.

---

## 13 — Observability

- Log lifecycle: scheduled, canceled, fired, dismissed.
- Log password failure *count* only (never the password).
- Error reporting for scheduling failures.

---

## 14 — Migration

- Version alarms table.
- Defaults for new fields (repeatDays, snooze, vibrate).
- Safe handling when password fields missing in old records.

---

## 15 — Acceptance Criteria (definition of done)

- [ ] User can add/edit/delete alarms from the first screen on app open.
- [ ] Time wheel sets alarm time reliably and persists.
- [ ] Disabling an alarm requires the correct per-alarm password.
- [ ] When alarm rings, it cannot be dismissed without correct password.
- [ ] Editing an enabled alarm reschedules correctly.
- [ ] Deleting an alarm cancels scheduled triggers.
- [ ] Password stored securely (hash + salt); no plaintext anywhere.
