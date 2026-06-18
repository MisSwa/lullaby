import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { TYPOGRAPHY } from '@theme/colors';
import { timeSince } from '../../utils/timeSince';
import { FeedLog } from '../../types/tracker';

interface BottleCardProps {
  lastLog: FeedLog | null;
  onPress: () => void;
}

export const BottleCard: React.FC<BottleCardProps> = ({ lastLog, onPress }) => {
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
          borderRadius: 20,
          backgroundColor: COLORS.surface,
          shadowColor: COLORS.bottle,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.20,
          shadowRadius: 16,
          elevation: 6,
        },
        clipWrapper: {
          borderRadius: 20,
          overflow: 'hidden',
        },
        headerBand: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 13,
          backgroundColor: COLORS.bottle,
        },
        headerLabel: {
          fontSize: 11,
          fontWeight: 'bold',
          color: COLORS.surface,
          textTransform: 'uppercase',
          letterSpacing: 1.8,
        },
        body: {
          padding: 14,
          backgroundColor: `${COLORS.bottle}12`,
        },
        ghost: {
          position: 'absolute',
          right: -8,
          bottom: -8,
          opacity: 0.15,
        },
        timeSince: {
          fontSize: 18,
          fontWeight: '700',
          color: COLORS.textPrimary,
          marginTop: 2,
        },
        detail: {
          fontSize: TYPOGRAPHY.size.xs,
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
  if (lastLog && lastLog.feedType === 'bottle' && lastLog.amountMl > 0) {
    detailStr = `${lastLog.amountMl} ml`;
  }

  return (
    <Animated.View style={{ flex: 1, transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.shadowWrapper}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.75}
      >
        <View style={styles.clipWrapper}>
          <View style={styles.headerBand}>
            <Text style={styles.headerLabel}>Bottle</Text>
            {notifications.feed.enabled && (
              <Ionicons name="notifications" size={14} color={COLORS.surface} />
            )}
          </View>
          <View style={styles.body}>
            <View style={styles.ghost}>
              <MaterialCommunityIcons name="baby-bottle" size={76} color={COLORS.bottle} />
            </View>
            <Text style={styles.timeSince}>{timeSinceStr}</Text>
            <Text style={styles.detail}>{detailStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
