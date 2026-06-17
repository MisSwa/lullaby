import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { TYPOGRAPHY } from '@theme/colors';
import { timeSince } from '../../utils/timeSince';
import { DiaperLog } from '../../types/tracker';

interface DiaperCardProps {
  lastLog: DiaperLog | null;
  onPress: () => void;
}

export const DiaperCard: React.FC<DiaperCardProps> = ({ lastLog, onPress }) => {
  const COLORS = useTheme();
  const { notifications } = useSettings();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shadowWrapper: {
          borderRadius: 16,
          backgroundColor: COLORS.surface,
          marginBottom: 12,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.09,
          shadowRadius: 10,
          elevation: 4,
        },
        clipWrapper: {
          borderRadius: 16,
          overflow: 'hidden',
        },
        headerBand: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 9,
          backgroundColor: COLORS.diaper,
        },
        headerLabel: {
          fontSize: 11,
          fontWeight: 'bold',
          color: COLORS.surface,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        },
        body: {
          padding: 14,
          backgroundColor: COLORS.surface,
        },
        ghost: {
          position: 'absolute',
          right: 10,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          opacity: 0.1,
        },
        timeSince: {
          fontSize: 22,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
          marginTop: 2,
        },
        detail: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
          marginTop: 2,
        },
      }),
    [COLORS],
  );

  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = (): void => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };
  const onPressOut = (): void => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };

  const timeSinceStr = timeSince(lastLog?.timestamp ?? null, now);

  let detailStr = '–';
  if (lastLog) {
    detailStr = lastLog.status.charAt(0).toUpperCase() + lastLog.status.slice(1);
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.shadowWrapper}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.75}
      >
        <View style={styles.clipWrapper}>
          <View style={styles.headerBand}>
            <Text style={styles.headerLabel}>Diaper</Text>
            {notifications.diaper.enabled && (
              <Ionicons name="notifications-outline" size={16} color={COLORS.surface} />
            )}
          </View>
          <View style={styles.body}>
            <View style={styles.ghost}>
              <Ionicons name="water-outline" size={88} color={COLORS.diaper} />
            </View>
            <Text style={styles.timeSince}>{timeSinceStr}</Text>
            <Text style={styles.detail}>{detailStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
