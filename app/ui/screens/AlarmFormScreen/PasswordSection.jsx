import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme/index.js";

export function PasswordSection({
  value,
  confirmValue,
  onChange,
  onChangeConfirm,
  error,
  isEdit,
  label = "Password",
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{isEdit ? "New password" : label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={isEdit ? "Leave blank to keep current" : "Min 4 characters"}
        placeholderTextColor={colors.outline}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!isEdit && (
        <>
          <Text style={[styles.label, { marginTop: spacing.sm }]}>Confirm</Text>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={confirmValue}
            onChangeText={onChangeConfirm}
            placeholder="Confirm password"
            placeholderTextColor={colors.outline}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginVertical: spacing.md },
  label: {
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
  inputError: { borderColor: colors.error },
  errorText: { ...typography.bodySmall, color: colors.error, marginTop: spacing.xs },
});
