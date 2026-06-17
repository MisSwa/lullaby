import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { useTracker } from '@context/TrackerContext';
import { useLiveTick } from '@hooks/useLiveTick';
import { TYPOGRAPHY } from '@theme/colors';

const MAX_RETROACTIVE_MS = 12 * 60 * 60 * 1000;

interface ActiveSleepViewProps {
  sleepStart: number;
  onStop: () => void;
}

export const ActiveSleepView: React.FC<ActiveSleepViewProps> = ({ sleepStart, onStop }) => {
  const COLORS = useTheme();
  const { notifications, timeFormat } = useSettings();
  const { updateSleepStart } = useTracker();
  const elapsed = useLiveTick(sleepStart);

  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [timeError, setTimeError] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.sleep,
          overflow: 'hidden',
          paddingBottom: 20,
        },
        topRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
        },
        categoryLabel: {
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: 'bold',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        bellIcon: {
          opacity: 0.5,
        },
        timerRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 4,
          gap: 4,
        },
        timerUnit: {
          alignItems: 'center',
          minWidth: 64,
        },
        timerDigit: {
          fontSize: 48,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
          fontVariant: ['tabular-nums'],
        },
        timerLabel: {
          fontSize: TYPOGRAPHY.size.xs,
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 2,
        },
        timerColon: {
          fontSize: 42,
          fontWeight: 'bold',
          color: COLORS.textMuted,
          marginBottom: 14,
        },
        startedRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginHorizontal: 20,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          marginTop: 8,
        },
        startedLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
        },
        startedValue: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '600',
          color: COLORS.primary,
        },
        errorText: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.error,
          marginHorizontal: 20,
          marginTop: -4,
          marginBottom: 8,
        },
        pickerWrapper: {
          marginHorizontal: 20,
          marginBottom: 4,
        },
        stopRing: {
          marginHorizontal: 20,
          marginTop: 12,
          borderWidth: 2,
          borderColor: COLORS.active,
          borderStyle: 'dashed',
          borderRadius: 14,
          padding: 3,
        },
        stopButton: {
          minHeight: 80,
          borderRadius: 12,
          backgroundColor: COLORS.active,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        stopIcon: {
          // icon sits inline with text
        },
        stopText: {
          fontSize: TYPOGRAPHY.size.lg,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
      }),
    [COLORS],
  );

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');

  const startedAt = new Date(sleepStart).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });

  const handleTimeChange = (_event: DateTimePickerEvent, selected?: Date): void => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected) return;
    try {
      updateSleepStart(selected.getTime());
      setTimeError('');
    } catch (err) {
      setTimeError(err instanceof Error ? err.message : 'Invalid time.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top label */}
      <View style={styles.topRow}>
        <Text style={styles.categoryLabel}>Sleep · Active</Text>
        {notifications.sleep.enabled && (
          <Ionicons
            name="notifications-outline"
            size={16}
            color={COLORS.sleep}
            style={styles.bellIcon}
          />
        )}
      </View>

      {/* HH : MM : SS display */}
      <View style={styles.timerRow}>
        <View style={styles.timerUnit}>
          <Text style={styles.timerDigit}>{pad(h)}</Text>
          <Text style={styles.timerLabel}>Hours</Text>
        </View>
        <Text style={styles.timerColon}>:</Text>
        <View style={styles.timerUnit}>
          <Text style={styles.timerDigit}>{pad(m)}</Text>
          <Text style={styles.timerLabel}>Min</Text>
        </View>
        <Text style={styles.timerColon}>:</Text>
        <View style={styles.timerUnit}>
          <Text style={styles.timerDigit}>{pad(s)}</Text>
          <Text style={styles.timerLabel}>Sec</Text>
        </View>
      </View>

      {/* Started at row */}
      {Platform.OS === 'android' && (
        <TouchableOpacity style={styles.startedRow} onPress={() => setShowPicker(true)}>
          <Text style={styles.startedLabel}>Started at</Text>
          <Text style={styles.startedValue}>Today, {startedAt} ›</Text>
        </TouchableOpacity>
      )}

      {Platform.OS === 'ios' && (
        <View style={styles.startedRow}>
          <Text style={styles.startedLabel}>Started at</Text>
          <Text style={styles.startedValue}>Today, {startedAt}</Text>
        </View>
      )}

      {timeError.length > 0 && <Text style={styles.errorText}>{timeError}</Text>}

      {showPicker && (
        <View style={styles.pickerWrapper}>
          <DateTimePicker
            value={new Date(sleepStart)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(Date.now() - MAX_RETROACTIVE_MS)}
            onChange={handleTimeChange}
          />
        </View>
      )}

      {/* Stop button with dashed ring */}
      <View style={styles.stopRing}>
        <TouchableOpacity style={styles.stopButton} onPress={onStop}>
          <Ionicons name="stop" size={24} color={COLORS.surface} style={styles.stopIcon} />
          <Text style={styles.stopText}>Stop Sleep</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
