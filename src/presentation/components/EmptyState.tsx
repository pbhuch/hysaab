import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../theme/theme';

interface EmptyStateProps {
  title: string;
  description: string;
  colors: ThemeColors;
  tip?: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  colors,
  tip,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.icon}>📁</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>
      {tip && (
        <View style={[styles.tipContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.tipTitle, { color: colors.primary }]}>💡 Quick Tip</Text>
          <Text style={[styles.tipText, { color: colors.text }]}>{tip}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    textAlign: 'center',
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  tipContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
export default EmptyState;
