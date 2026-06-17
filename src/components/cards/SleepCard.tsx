import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
        card: {
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: 12,
          minHeight: 90,
          overflow: 'hidden',
        },
        strip: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 5,
          backgroundColor: COLORS.sleep,
        },
        ghost: {
          position: 'absolute',
          left: 12,
          top: 0,
          bottom: 0,
          justifyContent: 'center',
          opacity: 0.1,
        },
        content: {
          paddingLeft: 64,
          paddingRight: 16,
          paddingVertical: 14,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        title: {
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: 'bold',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        badges: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        bellIcon: {
          opacity: 0.5,
        },
        liveBadge: {
          backgroundColor: COLORS.active,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        liveBadgeText: {
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: 'bold',
          color: COLORS.surface,
          fontVariant: ['tabular-nums'],
        },
        timeSince: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '600',
          color: COLORS.textPrimary,
          marginTop: 4,
        },
        detail: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
          marginTop: 2,
        },
      }),
    [COLORS],
  );

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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.strip} />
      <View style={styles.ghost}>
        <Ionicons name="moon-outline" size={72} color={COLORS.sleep} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Sleep</Text>
          <View style={styles.badges}>
            {notifications.sleep.enabled && (
              <Ionicons
                name="notifications-outline"
                size={16}
                color={COLORS.sleep}
                style={styles.bellIcon}
              />
            )}
            {sleepStart !== null && (
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>{formatHMS(liveSecs)}</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.timeSince}>{timeSinceStr}</Text>
        <Text style={styles.detail}>{detailStr}</Text>
      </View>
    </TouchableOpacity>
  );
};
