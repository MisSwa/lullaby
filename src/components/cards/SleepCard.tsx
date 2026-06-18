import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { TYPOGRAPHY } from '@theme/colors';
import { useLiveTick } from '@hooks/useLiveTick';
import { timeSince } from '../../utils/timeSince';
import { SleepLog } from '../../types/tracker';

interface SleepCardProps {
  lastLog: SleepLog | null;
  sleepStart: number | null;
  onPress: () => void;
}

function formatHMS(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const SleepCard: React.FC<SleepCardProps> = ({ lastLog, sleepStart, onPress }) => {
  const COLORS = useTheme();
  const { notifications } = useSettings();
  const liveSecs = useLiveTick(sleepStart);
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
          marginBottom: 8,
          shadowColor: COLORS.sleep,
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
          backgroundColor: COLORS.sleep,
        },
        headerLabel: {
          fontSize: 11,
          fontWeight: 'bold',
          color: COLORS.surface,
          textTransform: 'uppercase',
          letterSpacing: 1.8,
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        liveBadge: {
          backgroundColor: COLORS.surface,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        liveBadgeText: {
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: 'bold',
          color: COLORS.sleep,
          fontVariant: ['tabular-nums'],
        },
        body: {
          padding: 14,
          backgroundColor: `${COLORS.sleep}12`,
        },
        ghost: {
          position: 'absolute',
          right: -8,
          bottom: -8,
          opacity: 0.15,
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
  if (sleepStart !== null) {
    detailStr = 'active';
  } else if (lastLog) {
    if (lastLog.endTime) {
      const secs = Math.floor((lastLog.endTime - lastLog.timestamp) / 1000);
      detailStr = `slept ${formatElapsed(secs)}`;
    } else {
      detailStr = 'active';
    }
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
            <Text style={styles.headerLabel}>Sleep</Text>
            <View style={styles.headerRight}>
              {notifications.sleep.enabled && (
                <Ionicons name="notifications-outline" size={16} color={COLORS.surface} />
              )}
              {sleepStart !== null && (
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>{formatHMS(liveSecs)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.body}>
            <View style={styles.ghost}>
              <Ionicons name="moon" size={100} color={COLORS.sleep} />
            </View>
            <Text style={styles.timeSince}>{timeSinceStr}</Text>
            <Text style={styles.detail}>{detailStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
