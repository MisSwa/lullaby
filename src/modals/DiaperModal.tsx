import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';
import { DiaperLog } from '../types/tracker';

interface DiaperModalProps {
  visible: boolean;
  onSave: (status: DiaperLog['status'], timestamp: number) => Promise<void>;
  onDismiss: () => void;
}

type DiaperStatus = DiaperLog['status'];

interface DiapOption {
  status: DiaperStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  dimmed?: boolean;
}

const DIAPER_OPTIONS: DiapOption[] = [
  { status: 'wet', label: 'Pee', icon: 'water-outline' },
  { status: 'dirty', label: 'Poo', icon: 'cloud-outline' },
  { status: 'mixed', label: 'Mixed', icon: 'water' },
  { status: 'dry', label: 'Dry', icon: 'ban-outline', dimmed: true },
];

const MAX_RETROACTIVE_MS = 12 * 60 * 60 * 1000; // 12 hours

export const DiaperModal: React.FC<DiaperModalProps> = ({ visible, onSave, onDismiss }) => {
  const COLORS = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: COLORS.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 18,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        headerTitle: {
          fontSize: TYPOGRAPHY.size.lg,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        closeButton: {
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        closeText: {
          fontSize: TYPOGRAPHY.size.lg,
          color: COLORS.textMuted,
        },
        body: {
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 28,
        },
        startedRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          marginBottom: 32,
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
          marginTop: -24,
          marginBottom: 20,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'center',
        },
        cell: {
          width: '44%',
          alignItems: 'center',
          marginBottom: 8,
        },
        circle: {
          width: 100,
          height: 100,
          borderRadius: 50,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10,
        },
        circleLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textPrimary,
        },
        pickerWrapper: {
          marginBottom: 12,
        },
      }),
    [COLORS],
  );

  const [startTimestamp, setStartTimestamp] = useState<number>(Date.now());
  const [showPicker, setShowPicker] = useState(false);
  const [timeError, setTimeError] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset state when modal opens
  const handleShow = (): void => {
    setStartTimestamp(Date.now());
    setTimeError('');
    setSaving(false);
  };

  const handleTimeChange = (_event: DateTimePickerEvent, selected?: Date): void => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (!selected) return;
    const now = Date.now();
    const selectedMs = selected.getTime();
    if (now - selectedMs > MAX_RETROACTIVE_MS) {
      setTimeError('Time cannot be more than 12 hours in the past.');
      return;
    }
    if (selectedMs > now) {
      setTimeError('Time cannot be in the future.');
      return;
    }
    setTimeError('');
    setStartTimestamp(selectedMs);
  };

  const handleSelect = async (status: DiaperStatus): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(status, startTimestamp);
    } catch (error) {
      console.error('DiaperModal: failed to save:', error);
      setSaving(false);
    }
  };

  const formattedTime = new Date(startTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onShow={handleShow}
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Log Diaper</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Started at row */}
          <TouchableOpacity
            style={styles.startedRow}
            onPress={() => setShowPicker(true)}
          >
            <Text style={styles.startedLabel}>Started at</Text>
            <Text style={styles.startedValue}>Today, {formattedTime}</Text>
          </TouchableOpacity>

          {timeError.length > 0 && <Text style={styles.errorText}>{timeError}</Text>}

          {showPicker && (
            <View style={styles.pickerWrapper}>
              <DateTimePicker
                value={new Date(startTimestamp)}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                minimumDate={new Date(Date.now() - MAX_RETROACTIVE_MS)}
                onChange={handleTimeChange}
              />
            </View>
          )}

          {/* Icon grid */}
          <View style={styles.grid}>
            {DIAPER_OPTIONS.map(opt => (
              <View key={opt.status} style={styles.cell}>
                <TouchableOpacity
                  style={[
                    styles.circle,
                    {
                      backgroundColor: COLORS.diaper,
                      opacity: opt.dimmed ? 0.45 : 1,
                    },
                  ]}
                  onPress={() => handleSelect(opt.status)}
                  disabled={saving}
                >
                  <Ionicons name={opt.icon} size={42} color={COLORS.surface} />
                </TouchableOpacity>
                <Text style={styles.circleLabel}>{opt.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
