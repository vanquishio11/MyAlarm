import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useAlarms } from "../../../state/alarms-store.jsx";
import { useRingState } from "../../../state/ring-state.jsx";
import * as AlarmRepository from "../../../data/repositories/alarm-repository.js";
import * as AlarmScheduler from "../../../services/AlarmScheduler/index.js";
import { AlarmRow } from "./AlarmRow.jsx";
import { colors, spacing, typography } from "../../theme/index.js";

export function AlarmsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { alarms, loading, error, refresh } = useAlarms();
  const { setRinging } = useRingState();

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  // Reschedule all enabled alarms once when list has loaded (e.g. app start)
  const hasRescheduled = React.useRef(false);
  useEffect(() => {
    if (!db || loading || hasRescheduled.current) return;
    hasRescheduled.current = true;
    AlarmScheduler.rescheduleAll(db, alarms);
  }, [db, loading, alarms]);

  const handleAdd = () => router.push("/add");
  const handlePress = (alarm) => router.push(`/alarm/${alarm.id}`);
  const handleToggle = async (alarmId, enabled) => {
    if (!db) return;
    try {
      await AlarmRepository.updateAlarm(db, alarmId, { isEnabled: enabled });
      if (enabled) {
        const alarm = await AlarmRepository.getAlarm(db, alarmId);
        await AlarmScheduler.scheduleAlarm(db, alarm);
      } else {
        await AlarmScheduler.cancelAlarm(db, alarmId);
      }
      await refresh();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to update alarm");
    }
  };
  const handleToggleRequiresPassword = (alarm) => {
    router.push({ pathname: "/password-gate", params: { alarmId: alarm.id, action: "disable" } });
  };
  const handleDelete = (alarm) => {
    Alert.alert(
      "Delete alarm",
      `Delete ${alarm.label || "this alarm"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await AlarmScheduler.cancelAlarm(db, alarm.id);
              await AlarmRepository.deleteAlarm(db, alarm.id);
              await refresh();
            } catch (e) {
              Alert.alert("Error", e?.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AlarmRow
            alarm={item}
            onPress={handlePress}
            onToggle={handleToggle}
            onToggleRequiresPassword={handleToggleRequiresPassword}
            onDelete={handleDelete}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No alarms. Tap + to add one.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  error: { color: colors.error },
  empty: {
    ...typography.body,
    color: colors.outline,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});
