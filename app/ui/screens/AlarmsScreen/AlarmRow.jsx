import React from "react";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";
import { formatRepeatSummary } from "../../../domain/entities/alarm.js";
import { colors, spacing, typography } from "../../theme/index.js";

export function AlarmRow({
  alarm,
  onPress,
  onToggle,
  onToggleRequiresPassword,
  onDelete,
}) {
  const timeStr = `${String(alarm.hour).padStart(2, "0")}:${String(alarm.minute).padStart(2, "0")}`;
  const repeatStr = formatRepeatSummary(alarm.repeatDays);

  const handleToggle = (value) => {
    if (!value && onToggleRequiresPassword) {
      onToggleRequiresPassword(alarm);
      return;
    }
    onToggle(alarm.id, value);
  };

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onPress(alarm)}
      onLongPress={() => onDelete?.(alarm)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={styles.time}>{timeStr}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {alarm.label || "Alarm"}
        </Text>
        <Text style={styles.repeat}>{repeatStr}</Text>
      </View>
      <Switch
        value={alarm.isEnabled}
        onValueChange={handleToggle}
        trackColor={{ false: colors.outline, true: colors.primaryDim }}
        thumbColor={alarm.isEnabled ? colors.primary : colors.onSurface}
        accessibilityLabel={`Alarm ${timeStr} ${alarm.isEnabled ? "on" : "off"}`}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
  },
  left: { flex: 1 },
  time: {
    ...typography.title,
    color: colors.onBackground,
  },
  label: {
    ...typography.body,
    color: colors.onSurface,
    marginTop: 2,
  },
  repeat: {
    ...typography.bodySmall,
    color: colors.outline,
    marginTop: 2,
  },
});
