import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { ThemeColors } from '../theme/theme';

interface PinLockScreenProps {
  correctPinHash: string; // The stored PIN
  colors: ThemeColors;
  onSuccess: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  correctPinHash,
  colors,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    setError(false);
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        if (newPin === correctPinHash) {
          onSuccess();
        } else {
          // Failed code
          setTimeout(() => {
            setError(true);
            setPin('');
          }, 300);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const renderDot = (index: number) => {
    const active = pin.length > index;
    return (
      <View
        key={index}
        style={[
          styles.dot,
          {
            borderColor: colors.primary,
            backgroundColor: active ? colors.primary : 'transparent',
          },
        ]}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.icon, { color: colors.primary }]}>🔒</Text>
        <Text style={[styles.title, { color: colors.text }]}>Enter App PIN</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Please enter your 4-digit PIN code to log in
        </Text>
      </View>

      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map(renderDot)}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.danger }]}>
          Incorrect PIN. Please try again.
        </Text>
      )}

      <View style={styles.keyboard}>
        <View style={styles.keyboardRow}>
          {['1', '2', '3'].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.key, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleKeyPress(num)}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keyboardRow}>
          {['4', '5', '6'].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.key, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleKeyPress(num)}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keyboardRow}>
          {['7', '8', '9'].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.key, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleKeyPress(num)}
            >
              <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.keyboardRow}>
          <View style={styles.emptyKey} />
          
          <TouchableOpacity
            style={[styles.key, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleKeyPress('0')}
          >
            <Text style={[styles.keyText, { color: colors.text }]}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.key, styles.deleteKey, { backgroundColor: colors.background }]}
            onPress={handleDelete}
          >
            <Text style={[styles.deleteKeyText, { color: colors.primary }]}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 12,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  keyboard: {
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  key: {
    width: 75,
    height: 75,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  keyText: {
    fontSize: 26,
    fontWeight: '600',
  },
  emptyKey: {
    width: 75,
    height: 75,
  },
  deleteKey: {
    borderWidth: 0,
    elevation: 0,
  },
  deleteKeyText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
export default PinLockScreen;
