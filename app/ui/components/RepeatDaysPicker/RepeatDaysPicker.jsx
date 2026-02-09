import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { getRepeatDaysAsJsDays, DAY_NAMES, setDayInMask } from "../../../domain/entities/alarm.js";
import { colors, spacing, typography } from "../../theme/index.js";

// bit index 0 = Mon ... 6 = Sun
const JS_DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun

export function RepeatDaysPicker({ repeatDays, onRepeatDaysChange }) {
  const toggle = (jsDay) => {
    const enabled = ((repeatDays >> (jsDay === 0 ? 6 : jsDay - 1)) & 1) === 1;
    let next = repeatDays;
    const bit = jsDay === 0 ? 6 : jsDay - 1;
    if (enabled) next &= ~(1 << bit);
    else next |= 1 << bit;
    onRepeatDaysChange(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Repeat</Text>
      <View style={styles.row}>
        {JS_DAYS_ORDER.map((jsDay) => {
          const bit = jsDay === 0 ? 6 : jsDay - 1;
          const enabled = ((repeatDays >> bit) & 1) === 1;
          const name = jsDay === 0 ? "Sun" : DAY_NAMES[jsDay - 1];
          return (
            <TouchableOpacity
              key={jsDay}
              style={[styles.chip, enabled && styles.chipSelected]}
              onPress={() => toggle(jsDay)}
            >
              <Text style={[styles.chipText, enabled && styles.chipTextSelected]}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: spacing.md },
  label: {
    ...typography.label,
    color: colors.outline,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.onSurface },
  chipTextSelected: { color: colors.onPrimary },
});
