import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import * as AlarmRepository from "./data/repositories/alarm-repository.js";
import * as AlarmScheduler from "./services/AlarmScheduler/index.js";
import * as PasswordGate from "./services/PasswordGate/index.js";
import { AuthError } from "./core/errors.js";
import { colors, spacing, typography } from "./ui/theme/index.js";

export default function PasswordGatePage() {
  const router = useRouter();
  const { alarmId, action } = useLocalSearchParams();
  const db = useSQLiteContext();
  const [alarm, setAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!db || !alarmId) return;
    let cancelled = false;
    (async () => {
      try {
        const a = await AlarmRepository.getAlarm(db, alarmId);
        if (!cancelled) setAlarm(a);
      } catch (_) {
        if (!cancelled) router.back();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [db, alarmId]);

  useEffect(() => {
    router.setOptions({ title: "Enter password" });
  }, [router]);

  const handleSubmit = async () => {
    if (!db || !alarm) return;
    setError("");
    setSubmitting(true);
    try {
      const ok = await PasswordGate.verifyPassword(
        password,
        alarm.passwordHash,
        alarm.passwordSalt
      );
      if (!ok) {
        setError("Incorrect password");
        setSubmitting(false);
        return;
      }
      if (action === "disable") {
        await AlarmRepository.updateAlarm(db, alarm.id, { isEnabled: false });
        await AlarmScheduler.cancelAlarm(db, alarm.id);
      }
      router.back();
    } catch (e) {
      setError(e?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !alarm) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const prompt =
    action === "disable"
      ? `Enter password to disable "${alarm.label || "this alarm"}"`
      : "Enter password";

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{prompt}</Text>
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
        onPress={handleSubmit}
        disabled={submitting || !password.trim()}
      >
        <Text style={styles.buttonText}>
          {submitting ? "Checking…" : "Confirm"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  prompt: {
    ...typography.body,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  input: {
    ...typography.body,
    color: colors.onBackground,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  inputError: { borderColor: colors.error },
  error: { ...typography.bodySmall, color: colors.error, marginTop: spacing.sm },
  button: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { ...typography.headline, color: colors.onPrimary },
  cancel: {
    marginTop: spacing.md,
    alignItems: "center",
  },
  cancelText: { ...typography.body, color: colors.outline },
});
