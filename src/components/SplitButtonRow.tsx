import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@hooks/useTheme';

interface SplitButtonRowProps {
  leftLabel: string;
  rightLabel: string;
  onLeftPress: () => void;
  onRightPress: () => void;
}

export const SplitButtonRow: React.FC<SplitButtonRowProps> = ({
  leftLabel,
  rightLabel,
  onLeftPress,
  onRightPress,
}) => {
  const COLORS = useTheme();

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    leftButton: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: COLORS.border,
    },
    rightButton: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
    },
    leftLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.textMuted,
    },
    rightLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: COLORS.surface,
    },
  });

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.leftButton} onPress={onLeftPress} activeOpacity={0.7}>
        <Text style={styles.leftLabel}>{leftLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.rightButton} onPress={onRightPress} activeOpacity={0.7}>
        <Text style={styles.rightLabel}>{rightLabel}</Text>
      </TouchableOpacity>
    </View>
  );
};
