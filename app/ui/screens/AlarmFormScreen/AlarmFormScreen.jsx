import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useAlarms } from "../../../state/alarms-store.jsx";
import * as AlarmRepository from "../../../data/repositories/alarm-repository.js";
import * as AlarmScheduler from "../../../services/AlarmScheduler/index.js";
import * as PasswordGate from "../../../services/PasswordGate/index.js";
import { validateAlarmDraft, validatePassword } from "../../../domain/validation/alarm-rules.js";
import { generateId } from "../../../core/utils/ids.js";
import { DEFAULT_VIBRATE, DEFAULT_IS_ENABLED } from "../../../core/constants/defaults.js";
import { TimeWheel } from "../../components/TimeWheel/TimeWheel.jsx";
import { RepeatDaysPicker } from "../../components/RepeatDaysPicker/RepeatDaysPicker.jsx";
import { PasswordSection } from "./PasswordSection.jsx";
import { colors, spacing, typography } from "../../theme/index.js";

export function AlarmFormScreen({ alarmId }) {
  const router = useRouter();
  const db = useSQLiteContext();
  const { refresh } = useAlarms();
  const [loading, setLoading] = useState(!!alarmId);
  const [saving, setSaving] = useState(false);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState("");
  const [repeatDays, setRepeatDays] = useState(0);
  const [vibrate, setVibrate] = useState(DEFAULT_VIBRATE);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!alarmId || !db) return;
    let cancelled = false;
    (async () => {
      try {
        const alarm = await AlarmRepository.getAlarm(db, alarmId);
        if (!cancelled) {
          setHour(alarm.hour);
          setMinute(alarm.minute);
          setLabel(alarm.label || "");
          setRepeatDays(alarm.repeatDays);
          setVibrate(alarm.vibrate);
        }
      } catch (_) {
        if (!cancelled) router.back();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [alarmId, db]);

  const handleTimeChange = ({ hour: h, minute: m }) => {
    setHour(h);
    setMinute(m);
  };

  const handleSave = async () => {
    setPasswordError("");
    try {
      const draft = validateAlarmDraft({
        hour,
        minute,
        label: label.trim() || null,
        repeatDays,
        vibrate,
        isEnabled: DEFAULT_IS_ENABLED,
      });

      let passwordHash, passwordSalt;
      if (alarmId) {
        const existing = await AlarmRepository.getAlarm(db, alarmId);
        passwordHash = existing.passwordHash;
        passwordSalt = existing.passwordSalt;
        if (password.trim()) {
          validatePassword(password);
          if (password !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
          }
          const hashed = await PasswordGate.hashPassword(password);
          passwordHash = hashed.hash;
          passwordSalt = hashed.salt;
        }
      } else {
        validatePassword(password);
        if (password !== confirmPassword) {
          setPasswordError("Passwords do not match");
          return;
        }
        const hashed = await PasswordGate.hashPassword(password);
        passwordHash = hashed.hash;
        passwordSalt = hashed.salt;
      }

      setSaving(true);
      if (alarmId) {
        await AlarmRepository.updateAlarm(db, alarmId, {
          ...draft,
          passwordHash,
          passwordSalt,
        });
        await AlarmScheduler.cancelAlarm(db, alarmId);
        const updated = await AlarmRepository.getAlarm(db, alarmId);
        if (updated.isEnabled) await AlarmScheduler.scheduleAlarm(db, updated);
      } else {
        const id = generateId();
        await AlarmRepository.createAlarm(db, {
          id,
          ...draft,
          passwordHash,
          passwordSalt,
        });
        const created = await AlarmRepository.getAlarm(db, id);
        if (created.isEnabled) await AlarmScheduler.scheduleAlarm(db, created);
      }
      await refresh();
      router.back();
    } catch (e) {
      setPasswordError(e?.message || "Invalid input");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TimeWheel hour={hour} minute={minute} onTimeChange={handleTimeChange} />
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Label</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="Alarm name (optional)"
          placeholderTextColor={colors.outline}
        />
      </View>
      <RepeatDaysPicker repeatDays={repeatDays} onRepeatDaysChange={setRepeatDays} />
      <PasswordSection
        value={password}
        confirmValue={confirmPassword}
        onChange={setPassword}
        onChangeConfirm={setConfirmPassword}
        error={passwordError}
        isEdit={!!alarmId}
      />
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.primary]}
          onPress={handleSave}
          disabled={saving || (!alarmId && !password.trim())}
        >
          <Text style={styles.primaryText}>{saving ? "Saving…" : "Save"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.secondaryText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  field: { marginVertical: spacing.sm },
  fieldLabel: {
    ...typography.label,
    color: colors.outline,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    color: colors.onBackground,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  buttons: { marginTop: spacing.xl, gap: spacing.md },
  button: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  primary: { backgroundColor: colors.primary },
  primaryText: { ...typography.headline, color: colors.onPrimary },
  secondaryText: { ...typography.body, color: colors.onSurface },
});
