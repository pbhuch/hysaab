import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { ThemeColors } from '../theme/theme';

interface CardProps {
  children: React.ReactNode;
  colors: ThemeColors;
  style?: ViewStyle;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, colors, style }) => {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
});
export default Card;
