import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ThemeColors } from '../theme/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  colors: ThemeColors;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  colors,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
}) => {
  const getStyles = () => {
    const baseStyle: ViewStyle[] = [styles.button];
    const textStyle: TextStyle[] = [styles.text];

    // Size styles
    if (size === 'sm') {
      baseStyle.push(styles.smButton);
      textStyle.push(styles.smText);
    } else if (size === 'lg') {
      baseStyle.push(styles.lgButton);
      textStyle.push(styles.lgText);
    } else {
      baseStyle.push(styles.mdButton);
      textStyle.push(styles.mdText);
    }

    // Variant styles
    if (variant === 'primary') {
      baseStyle.push({ backgroundColor: colors.primary });
      textStyle.push({ color: '#ffffff', fontWeight: '600' });
    } else if (variant === 'secondary') {
      baseStyle.push({ backgroundColor: colors.secondary });
      textStyle.push({ color: '#ffffff', fontWeight: '600' });
    } else if (variant === 'outline') {
      baseStyle.push({ backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary });
      textStyle.push({ color: colors.primary, fontWeight: '500' });
    } else if (variant === 'danger') {
      baseStyle.push({ backgroundColor: colors.danger });
      textStyle.push({ color: '#ffffff', fontWeight: '600' });
    } else if (variant === 'text') {
      baseStyle.push({ backgroundColor: 'transparent', paddingHorizontal: 4 });
      textStyle.push({ color: colors.primary, fontWeight: '500' });
    }

    if (disabled) {
      baseStyle.push({ opacity: 0.5 });
    }

    return { baseStyle, textStyle };
  };

  const { baseStyle, textStyle } = getStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[baseStyle, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'text' ? colors.primary : '#ffffff'} size="small" />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
  smButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  mdButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lgButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 17,
  },
});
export default Button;
