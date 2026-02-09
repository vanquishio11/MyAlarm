/**
 * Sliding time wheel: hour and minute columns that snap to values.
 * Accessible labels; onScrollEnd updates selected hour/minute.
 */

import React, { useRef, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme/index.js";

const ROW_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;
const PAD = ROW_HEIGHT * Math.floor((VISIBLE_ROWS - 1) / 2);

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

export function TimeWheel({ hour, minute, onTimeChange }) {
  const hourRef = useRef(null);
  const minuteRef = useRef(null);

  useEffect(() => {
    const y = hour * ROW_HEIGHT;
    hourRef.current?.scrollTo({ y, animated: false });
  }, [hour]);
  useEffect(() => {
    const y = minute * ROW_HEIGHT;
    minuteRef.current?.scrollTo({ y, animated: false });
  }, [minute]);

  const handleHourScrollEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(23, index));
    if (clamped !== hour) onTimeChange({ hour: clamped, minute });
  };

  const handleMinuteScrollEnd = (e) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(59, index));
    if (clamped !== minute) onTimeChange({ hour, minute: clamped });
  };

  return (
    <View style={styles.container}>
      <View style={styles.wheelCol}>
        <Text style={styles.label} accessibilityLabel="Hour picker">
          Hour
        </Text>
        <ScrollView
          ref={hourRef}
          style={styles.wheel}
          contentContainerStyle={styles.wheelContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={handleHourScrollEnd}
          scrollEventThrottle={16}
          accessibilityLabel="Hour"
        >
          {hours.map((h) => (
            <View key={h} style={styles.row}>
              <Text style={[styles.cell, h === hour && styles.cellSelected]}>
                {String(h).padStart(2, "0")}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.wheelCol}>
        <Text style={styles.label} accessibilityLabel="Minute picker">
          Min
        </Text>
        <ScrollView
          ref={minuteRef}
          style={styles.wheel}
          contentContainerStyle={styles.wheelContent}
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          onMomentumScrollEnd={handleMinuteScrollEnd}
          scrollEventThrottle={16}
          accessibilityLabel="Minute"
        >
          {minutes.map((m) => (
            <View key={m} style={styles.row}>
              <Text style={[styles.cell, m === minute && styles.cellSelected]}>
                {String(m).padStart(2, "0")}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  wheelCol: {
    alignItems: "center",
    marginHorizontal: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.outline,
    marginBottom: spacing.xs,
  },
  wheel: {
    height: WHEEL_HEIGHT,
    width: 72,
  },
  wheelContent: {
    paddingVertical: PAD,
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  cell: {
    ...typography.headline,
    color: colors.onSurface,
  },
  cellSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
});
