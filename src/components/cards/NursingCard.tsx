import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { TYPOGRAPHY } from '@theme/colors';
import { useLiveTick } from '@hooks/useLiveTick';
import { timeSince } from '../../utils/timeSince';
import { FeedLog } from '../../types/tracker';

interface NursingCardProps {
  lastLog: FeedLog | null;
  feedLeftStart: number | null;
  feedRightStart: number | null;
  feedLeftElapsed: number;
  feedRightElapsed: number;
  onPress: () => void;
}

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

export const NursingCard: React.FC<NursingCardProps> = ({
  lastLog,
  feedLeftStart,
  feedRightStart,
  feedLeftElapsed,
  feedRightElapsed,
  onPress,
}) => {
  const COLORS = useTheme();
  const { notifications } = useSettings();
  const leftTick = useLiveTick(feedLeftStart);
  const rightTick = useLiveTick(feedRightStart);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shadowWrapper: {
          flex: 1,
          borderRadius: 16,
          backgroundColor: COLORS.surface,
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
          backgroundColor: COLORS.feed,
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
          fontSize: 16,
          fontWeight: '600',
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

  const totalLeft = feedLeftElapsed + leftTick;
  const totalRight = feedRightElapsed + rightTick;
  const isRunning = feedLeftStart !== null || feedRightStart !== null;

  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = (): void => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };
  const onPressOut = (): void => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };

  const timeSinceStr = timeSince(lastLog?.timestamp ?? null, now);

  let detailStr = '–';
  if (isRunning) {
    const parts: string[] = [];
    if (totalLeft > 0) parts.push(`L: ${formatSecs(totalLeft)}`);
    if (totalRight > 0) parts.push(`R: ${formatSecs(totalRight)}`);
    detailStr = parts.join(' · ') || 'active';
  } else if (lastLog && lastLog.feedType === 'breast') {
    const parts: string[] = [];
    if (lastLog.leftDuration > 0)
      parts.push(`L: ${Math.floor(lastLog.leftDuration / 60)}m`);
    if (lastLog.rightDuration > 0)
      parts.push(`R: ${Math.floor(lastLog.rightDuration / 60)}m`);
    detailStr = parts.join(' · ');
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
            <Text style={styles.headerLabel}>Nursing</Text>
            {notifications.feed.enabled && (
              <Ionicons name="notifications-outline" size={14} color={COLORS.surface} />
            )}
          </View>
          <View style={styles.body}>
            <View style={styles.ghost}>
              <Ionicons name="heart-outline" size={68} color={COLORS.feed} />
            </View>
            <Text style={styles.timeSince}>{timeSinceStr}</Text>
            <Text style={styles.detail}>{detailStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
