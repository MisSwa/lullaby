import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useSettings } from '@context/SettingsContext';
import { TYPOGRAPHY } from '@theme/colors';
import { useLiveTick } from '@hooks/useLiveTick';

type FeedTab = 'nursing' | 'bottle';

interface FeedModalProps {
  visible: boolean;
  initialTab?: FeedTab;
  // Nursing props
  feedLeftStart: number | null;
  feedRightStart: number | null;
  feedLeftElapsed: number;
  feedRightElapsed: number;
  onToggleSide: (side: 'left' | 'right') => void;
  onSaveNursing: (notes?: string) => Promise<void>;
  // Bottle props
  onSaveBottle: (amountMl: number) => Promise<void>;
  onDismiss: () => void;
}

const MAX_RETROACTIVE_MS = 12 * 60 * 60 * 1000;

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const FeedModal: React.FC<FeedModalProps> = ({
  visible,
  initialTab = 'nursing',
  feedLeftStart,
  feedRightStart,
  feedLeftElapsed,
  feedRightElapsed,
  onToggleSide,
  onSaveNursing,
  onSaveBottle,
  onDismiss,
}) => {
  const COLORS = useTheme();
  const { units, updateUnits } = useSettings();

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
        tabRow: {
          flexDirection: 'row',
          marginHorizontal: 24,
          marginTop: 20,
          marginBottom: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.feed,
          overflow: 'hidden',
        },
        tab: {
          flex: 1,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabActive: {
          backgroundColor: COLORS.feed,
        },
        tabText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.feed,
        },
        tabTextActive: {
          color: COLORS.surface,
        },
        body: {
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 16,
        },
        startedRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          marginBottom: 28,
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
          marginTop: -20,
          marginBottom: 16,
        },
        sidesRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 24,
          marginBottom: 32,
        },
        sideCell: {
          alignItems: 'center',
          gap: 10,
        },
        sideCircle: {
          width: 120,
          height: 120,
          borderRadius: 60,
          justifyContent: 'center',
          alignItems: 'center',
        },
        sideLabel: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        sideTimer: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
          fontVariant: ['tabular-nums'],
        },
        saveButton: {
          height: 52,
          borderRadius: 12,
          backgroundColor: COLORS.feed,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 8,
        },
        saveButtonDisabled: {
          opacity: 0.4,
        },
        saveButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        sliderSection: {
          alignItems: 'center',
          marginBottom: 24,
        },
        sliderBadge: {
          fontSize: TYPOGRAPHY.size.xl,
          fontWeight: 'bold',
          color: COLORS.feed,
          marginBottom: 8,
        },
        slider: {
          width: '100%',
          height: 40,
        },
        sliderLabels: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 4,
        },
        sliderLabelText: {
          fontSize: TYPOGRAPHY.size.xs,
          color: COLORS.textMuted,
        },
        unitRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24,
        },
        unitPill: {
          paddingHorizontal: 20,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.feed,
        },
        unitPillActive: {
          backgroundColor: COLORS.feed,
        },
        unitPillText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.feed,
        },
        unitPillTextActive: {
          color: COLORS.surface,
        },
        pickerWrapper: {
          marginBottom: 12,
        },
      }),
    [COLORS],
  );

  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  const [nursingStartTime, setNursingStartTime] = useState<number>(Date.now());
  const [showNursingPicker, setShowNursingPicker] = useState(false);
  const [nursingTimeError, setNursingTimeError] = useState('');
  const [savingNursing, setSavingNursing] = useState(false);

  const [bottleAmountMl, setBottleAmountMl] = useState(60);
  const [bottleStartTime, setBottleStartTime] = useState<number>(Date.now());
  const [showBottlePicker, setShowBottlePicker] = useState(false);
  const [bottleTimeError, setBottleTimeError] = useState('');
  const [savingBottle, setSavingBottle] = useState(false);

  const leftTick = useLiveTick(feedLeftStart);
  const rightTick = useLiveTick(feedRightStart);
  const totalLeft = feedLeftElapsed + leftTick;
  const totalRight = feedRightElapsed + rightTick;
  const hasNursingTime = totalLeft > 0 || totalRight > 0;

  const handleShow = (): void => {
    setActiveTab(initialTab);
    setNursingStartTime(Date.now());
    setNursingTimeError('');
    setSavingNursing(false);
    setBottleAmountMl(60);
    setBottleStartTime(Date.now());
    setBottleTimeError('');
    setSavingBottle(false);
    setShowNursingPicker(false);
    setShowBottlePicker(false);
  };

  const handleNursingTimeChange = (_event: DateTimePickerEvent, selected?: Date): void => {
    if (Platform.OS === 'android') setShowNursingPicker(false);
    if (!selected) return;
    const now = Date.now();
    const ms = selected.getTime();
    if (now - ms > MAX_RETROACTIVE_MS) {
      setNursingTimeError('Time cannot be more than 12 hours in the past.');
      return;
    }
    if (ms > now) {
      setNursingTimeError('Time cannot be in the future.');
      return;
    }
    setNursingTimeError('');
    setNursingStartTime(ms);
  };

  const handleBottleTimeChange = (_event: DateTimePickerEvent, selected?: Date): void => {
    if (Platform.OS === 'android') setShowBottlePicker(false);
    if (!selected) return;
    const now = Date.now();
    const ms = selected.getTime();
    if (now - ms > MAX_RETROACTIVE_MS) {
      setBottleTimeError('Time cannot be more than 12 hours in the past.');
      return;
    }
    if (ms > now) {
      setBottleTimeError('Time cannot be in the future.');
      return;
    }
    setBottleTimeError('');
    setBottleStartTime(ms);
  };

  const handleSaveNursing = async (): Promise<void> => {
    if (!hasNursingTime || savingNursing) return;
    setSavingNursing(true);
    try {
      await onSaveNursing();
    } catch (error) {
      console.error('FeedModal: failed to save nursing:', error);
      setSavingNursing(false);
    }
  };

  const handleSaveBottle = async (): Promise<void> => {
    if (savingBottle) return;
    setSavingBottle(true);
    try {
      await onSaveBottle(bottleAmountMl);
    } catch (error) {
      console.error('FeedModal: failed to save bottle:', error);
      setSavingBottle(false);
    }
  };

  const displayAmount =
    units === 'oz' ? `${(bottleAmountMl / 29.5735).toFixed(1)} oz` : `${bottleAmountMl} ml`;

  const nursingTime = new Date(nursingStartTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const bottleTime = new Date(bottleStartTime).toLocaleTimeString([], {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Feeding</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nursing' && styles.tabActive]}
            onPress={() => setActiveTab('nursing')}
          >
            <Text style={[styles.tabText, activeTab === 'nursing' && styles.tabTextActive]}>
              Nursing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'bottle' && styles.tabActive]}
            onPress={() => setActiveTab('bottle')}
          >
            <Text style={[styles.tabText, activeTab === 'bottle' && styles.tabTextActive]}>
              Bottle
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {activeTab === 'nursing' ? (
            <>
              {/* Retroactive start time */}
              <TouchableOpacity
                style={styles.startedRow}
                onPress={() => setShowNursingPicker(true)}
              >
                <Text style={styles.startedLabel}>Started at</Text>
                <Text style={styles.startedValue}>Today, {nursingTime}</Text>
              </TouchableOpacity>
              {nursingTimeError.length > 0 && (
                <Text style={styles.errorText}>{nursingTimeError}</Text>
              )}
              {showNursingPicker && (
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={new Date(nursingStartTime)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    minimumDate={new Date(Date.now() - MAX_RETROACTIVE_MS)}
                    onChange={handleNursingTimeChange}
                  />
                </View>
              )}

              {/* L / R buttons */}
              <View style={styles.sidesRow}>
                {(['left', 'right'] as const).map(side => {
                  const isRunning =
                    side === 'left' ? feedLeftStart !== null : feedRightStart !== null;
                  const elapsed = side === 'left' ? totalLeft : totalRight;
                  return (
                    <View key={side} style={styles.sideCell}>
                      <TouchableOpacity
                        style={[
                          styles.sideCircle,
                          { backgroundColor: isRunning ? COLORS.active : COLORS.feed },
                        ]}
                        onPress={() => onToggleSide(side)}
                      >
                        <Text style={styles.sideLabel}>{side === 'left' ? 'L' : 'R'}</Text>
                        <Ionicons
                          name={isRunning ? 'stop' : 'play'}
                          size={20}
                          color={COLORS.surface}
                        />
                      </TouchableOpacity>
                      <Text style={styles.sideTimer}>{formatSecs(elapsed)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Save session */}
              <TouchableOpacity
                style={[styles.saveButton, (!hasNursingTime || savingNursing) && styles.saveButtonDisabled]}
                onPress={handleSaveNursing}
                disabled={!hasNursingTime || savingNursing}
              >
                {savingNursing ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Session</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Retroactive start time */}
              <TouchableOpacity
                style={styles.startedRow}
                onPress={() => setShowBottlePicker(true)}
              >
                <Text style={styles.startedLabel}>Started at</Text>
                <Text style={styles.startedValue}>Today, {bottleTime}</Text>
              </TouchableOpacity>
              {bottleTimeError.length > 0 && (
                <Text style={styles.errorText}>{bottleTimeError}</Text>
              )}
              {showBottlePicker && (
                <View style={styles.pickerWrapper}>
                  <DateTimePicker
                    value={new Date(bottleStartTime)}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    minimumDate={new Date(Date.now() - MAX_RETROACTIVE_MS)}
                    onChange={handleBottleTimeChange}
                  />
                </View>
              )}

              {/* Slider */}
              <View style={styles.sliderSection}>
                <Text style={styles.sliderBadge}>{displayAmount}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={300}
                  step={5}
                  value={bottleAmountMl}
                  onValueChange={(v: number) => setBottleAmountMl(Math.round(v))}
                  minimumTrackTintColor={COLORS.feed}
                  maximumTrackTintColor={COLORS.border}
                  thumbTintColor={COLORS.feed}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabelText}>0</Text>
                  <Text style={styles.sliderLabelText}>300 ml</Text>
                </View>
              </View>

              {/* ml / oz toggle */}
              <View style={styles.unitRow}>
                {(['ml', 'oz'] as const).map(u => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitPill, units === u && styles.unitPillActive]}
                    onPress={() => {
                      updateUnits(u).catch((err: unknown) =>
                        console.error('Failed to update units:', err),
                      );
                    }}
                  >
                    <Text style={[styles.unitPillText, units === u && styles.unitPillTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save */}
              <TouchableOpacity
                style={[styles.saveButton, savingBottle && styles.saveButtonDisabled]}
                onPress={handleSaveBottle}
                disabled={savingBottle || bottleAmountMl === 0}
              >
                {savingBottle ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};
