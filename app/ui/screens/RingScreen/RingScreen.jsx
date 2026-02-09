import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useRingState } from "../../../state/ring-state.jsx";
import { useAlarms } from "../../../state/alarms-store.jsx";
import * as AlarmRepository from "../../../data/repositories/alarm-repository.js";
import * as AlarmScheduler from "../../../services/AlarmScheduler/index.js";
import * as PasswordGate from "../../../services/PasswordGate/index.js";
import * as AlarmRinger from "../../../services/AlarmRinger/index.js";
import { colors, spacing, typography } from "../../theme/index.js";

export function RingScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { ringingAlarm, clearRinging, recordFailedAttempt } = useRingState();
  const { refresh } = useAlarms();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ringingAlarm) {
      AlarmRinger.start({ vibrate: true });
    }
    return () => {
      AlarmRinger.stop();
    };
  }, [ringingAlarm?.id]);

  const handleDismiss = async () => {
    if (!db || !ringingAlarm) return;
    setError("");
    const ok = await PasswordGate.verifyPassword(
      password,
      ringingAlarm.passwordHash,
      ringingAlarm.passwordSalt
    );
    if (!ok) {
      setError("Incorrect password");
      recordFailedAttempt();
      return;
    }
    await AlarmRinger.stop();
    if (ringingAlarm.repeatDays > 0) {
      await AlarmScheduler.scheduleAlarm(db, ringingAlarm);
    }
    clearRinging();
    await refresh();
    router.replace("/");
  };

  if (!ringingAlarm) {
    router.replace("/");
    return null;
  }

  const timeStr = `${String(ringingAlarm.hour).padStart(2, "0")}:${String(ringingAlarm.minute).padStart(2, "0")}`;

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{timeStr}</Text>
      <Text style={styles.label}>{ringingAlarm.label || "Alarm"}</Text>
      <Text style={styles.hint}>Enter password to dismiss</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={password}
        onChangeText={(t) => { setPassword(t); setError(""); }}
        placeholder="Password"
        placeholderTextColor={colors.outline}
        secureTextEntry
        autoFocus
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={styles.button}
        onPress={handleDismiss}
        disabled={!password.trim()}
      >
        <Text style={styles.buttonText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  time: {
    fontSize: 64,
    fontWeight: "700",
    color: colors.onBackground,
  },
  label: {
    ...typography.headline,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.body,
    color: colors.outline,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.onBackground,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outline,
    width: "100%",
    maxWidth: 320,
  },
  inputError: { borderColor: colors.error },
  error: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  buttonText: { ...typography.headline, color: colors.onPrimary },
});
