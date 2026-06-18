import React, { useMemo, useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';
import { timeSince } from '../../utils/timeSince';
import { FeedLog } from '../../types/tracker';

interface SolidsCardProps {
  lastLog: FeedLog | null;
  onPress: () => void;
  onLongPress: () => void;
}

export const SolidsCard: React.FC<SolidsCardProps> = ({ lastLog, onPress, onLongPress }) => {
  const COLORS = useTheme();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = (): void => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };
  const onPressOut = (): void => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15, stiffness: 300 }).start();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shadowWrapper: {
          borderRadius: 20,
          backgroundColor: COLORS.surface,
          marginBottom: 8,
          shadowColor: COLORS.solids,
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
          backgroundColor: COLORS.solids,
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
          backgroundColor: `${COLORS.solids}12`,
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

  const timeSinceStr = timeSince(lastLog?.timestamp ?? null, now);
  const detailStr = useMemo((): string => {
    if (!lastLog) return '–';
    try {
      const parsed = JSON.parse(lastLog.notes) as { items?: Array<{ food: string; amount: string }> };
      if (parsed.items && Array.isArray(parsed.items)) {
        const foods = parsed.items
          .filter(i => i.food.trim())
          .map(i => i.food.trim());
        return foods.length > 0 ? foods.join(', ') : 'logged';
      }
    } catch {
      // old plain-text format
      const first = lastLog.notes.split('\n')[0].trim();
      return first.length > 0 ? first : 'logged';
    }
    return 'logged';
  }, [lastLog]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={styles.shadowWrapper}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.75}
      >
        <View style={styles.clipWrapper}>
          <View style={styles.headerBand}>
            <Text style={styles.headerLabel}>Solids</Text>
            <Ionicons name="notifications-outline" size={16} color={COLORS.surface} style={{ opacity: 0 }} />
          </View>
          <View style={styles.body}>
            <View style={styles.ghost}>
              <Ionicons name="leaf" size={100} color={COLORS.solids} />
            </View>
            <Text style={styles.timeSince}>{timeSinceStr}</Text>
            <Text style={styles.detail}>{detailStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
