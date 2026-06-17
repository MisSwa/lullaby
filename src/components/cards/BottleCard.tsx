import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

  const timeSinceStr = timeSince(lastLog?.timestamp ?? null, now);

  let detailStr = '–';
  if (lastLog && lastLog.feedType === 'bottle' && lastLog.amountMl > 0) {
    detailStr = `${lastLog.amountMl} ml`;
  }

  return (
    <TouchableOpacity style={styles.shadowWrapper} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.clipWrapper}>
        <View style={styles.headerBand}>
          <Text style={styles.headerLabel}>Bottle</Text>
          {notifications.feed.enabled && (
            <Ionicons name="notifications-outline" size={14} color={COLORS.surface} />
          )}
        </View>
        <View style={styles.body}>
          <View style={styles.ghost}>
            <MaterialCommunityIcons name="baby-bottle-outline" size={60} color={COLORS.feed} />
          </View>
          <Text style={styles.timeSince}>{timeSinceStr}</Text>
          <Text style={styles.detail}>{detailStr}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
