import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { TYPOGRAPHY } from '@theme/colors';

const MAX_RETROACTIVE_MS = 12 * 60 * 60 * 1000;

interface SleepSummaryModalProps {
  visible: boolean;
  sleepStart: number;
  onUpdateStart: (timestamp: number) => void;
  onSave: (notes: string, endTime: number) => Promise<void>;
  onDismiss: () => void;
}

function formatDuration(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const SleepSummaryModal: React.FC<SleepSummaryModalProps> = ({
  visible,
  sleepStart,
  onUpdateStart,
  onSave,
  onDismiss,
}) => {
  const COLORS = useTheme();
  const { timeFormat } = useSettings();

  const [endTime, setEndTime] = useState<number>(Date.now());
  const [notes, setNotes] = useState('');
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [timeError, setTimeError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleShow = (): void => {
    setEndTime(Date.now());
    setNotes('');
    setActivePicker(null);
    setTimeError('');
    setSaving(false);
  };

  const hour12 = timeFormat === '12h';

  const fmtTime = (ts: number): string =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12 });

  const handleStartChange = (_event: DateTimePickerEvent, selected?: Date): void => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (!selected) return;
    const now = Date.now();
    const ms = selected.getTime();
    if (ms > now) {
      setTimeError('Start time cannot be in the future.');
      return;
    }
    if (now - ms > MAX_RETROACTIVE_MS) {
      setTimeError('Start time cannot be more than 12 hours in the past.');
      return;
    }
    if (ms >= endTime) {
      setTimeError('Start time must be before end time.');
      return;
    }
    setTimeError('');
    onUpdateStart(ms);
  };

  const handleEndChange = (_event: DateTimePickerEvent, selected?: Date): void => {
    if (Platform.OS === 'android') setActivePicker(null);
    if (!selected) return;
    const now = Date.now();
    const ms = selected.getTime();
    if (ms > now) {
      setTimeError('End time cannot be in the future.');
      return;
    }
    if (now - ms > MAX_RETROACTIVE_MS) {
      setTimeError('End time cannot be more than 12 hours in the past.');
      return;
    }
    if (ms <= sleepStart) {
      setTimeError('End time must be after start time.');
      return;
    }
    setTimeError('');
    setEndTime(ms);
  };

  const handleSave = async (): Promise<void> => {
    if (saving) return;
    if (endTime <= sleepStart) {
      setTimeError('End time must be after start time.');
      return;
    }
    setSaving(true);
    try {
      await onSave(notes.trim(), endTime);
    } catch (error) {
      console.error('SleepSummaryModal: failed to save:', error);
      setSaving(false);
    }
  };

  const durationMs = Math.max(0, endTime - sleepStart);

  // Compute picker bounds at render time so minimumDate is always < maximumDate.
  // For the end picker, cap the minimum to (now - 1ms) in case the sleep just started
  // and sleepStart + buffer would be in the future.
  const now = Date.now();
  const pickerMax = new Date(now);
  const pickerValue = activePicker === 'start' ? new Date(sleepStart) : new Date(endTime);
  const pickerMin =
    activePicker === 'start'
      ? new Date(now - MAX_RETROACTIVE_MS)
      : new Date(Math.min(sleepStart + 1000, now - 1000));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: COLORS.background },
        flex: { flex: 1 },
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
        closeText: { fontSize: TYPOGRAPHY.size.lg, color: COLORS.textMuted },
        body: { flex: 1 },
        bodyContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },
        durationHero: {
          alignItems: 'center',
          paddingVertical: 24,
          marginBottom: 20,
          backgroundColor: COLORS.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: COLORS.border,
        },
        durationValue: {
          fontSize: 48,
          fontWeight: 'bold',
          color: COLORS.sleep,
          letterSpacing: -1,
        },
        durationLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginTop: 4,
        },
        timeRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        timeLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
        },
        timeValue: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '600',
          color: COLORS.primary,
        },
        errorText: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.error,
          marginTop: 8,
          marginBottom: 4,
        },
        pickerWrapper: { marginVertical: 8 },
        notesLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginTop: 24,
          marginBottom: 10,
        },
        notesInput: {
          height: 100,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingTop: 14,
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.surface,
          marginBottom: 24,
          textAlignVertical: 'top',
        },
        saveButton: {
          height: 52,
          borderRadius: 12,
          backgroundColor: COLORS.sleep,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
        },
        saveButtonDisabled: { opacity: 0.45 },
        saveButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        cancelButton: {
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        cancelButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textMuted,
        },
      }),
    [COLORS],
  );

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
          <Text style={styles.headerTitle}>Sleep Summary</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss} disabled={saving}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Duration hero */}
            <View style={styles.durationHero}>
              <Text style={styles.durationValue}>{formatDuration(durationMs)}</Text>
              <Text style={styles.durationLabel}>Total Sleep</Text>
            </View>

            {/* Start time row */}
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setActivePicker(activePicker === 'start' ? null : 'start')}
              disabled={saving}
            >
              <Text style={styles.timeLabel}>Started</Text>
              <Text style={styles.timeValue}>Today, {fmtTime(sleepStart)} ›</Text>
            </TouchableOpacity>

            {/* End time row */}
            <TouchableOpacity
              style={styles.timeRow}
              onPress={() => setActivePicker(activePicker === 'end' ? null : 'end')}
              disabled={saving}
            >
              <Text style={styles.timeLabel}>Ended</Text>
              <Text style={styles.timeValue}>Today, {fmtTime(endTime)} ›</Text>
            </TouchableOpacity>

            {timeError.length > 0 && <Text style={styles.errorText}>{timeError}</Text>}

            {/* Picker — shown inline on iOS, triggered on Android */}
            {activePicker !== null && (
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={pickerValue}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={pickerMax}
                  minimumDate={pickerMin}
                  onChange={activePicker === 'start' ? handleStartChange : handleEndChange}
                />
              </View>
            )}

            {/* Notes */}
            <Text style={styles.notesLabel}>How did they sleep?</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add a note..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={200}
              editable={!saving}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Save Session</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onDismiss}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
