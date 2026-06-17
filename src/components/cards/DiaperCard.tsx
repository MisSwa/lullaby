import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
          backgroundColor: COLORS.diaper,
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
        bellIcon: {
          opacity: 0.5,
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
  if (lastLog) {
    detailStr = lastLog.status.charAt(0).toUpperCase() + lastLog.status.slice(1);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.strip} />
      <View style={styles.ghost}>
        <Ionicons name="water-outline" size={72} color={COLORS.diaper} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Diaper</Text>
          {notifications.diaper.enabled && (
            <Ionicons
              name="notifications-outline"
              size={16}
              color={COLORS.diaper}
              style={styles.bellIcon}
            />
          )}
        </View>
        <Text style={styles.timeSince}>{timeSinceStr}</Text>
        <Text style={styles.detail}>{detailStr}</Text>
      </View>
    </TouchableOpacity>
  );
};
