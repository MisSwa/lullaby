import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
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
  onAdjustFeedStart: (deltaMs: number) => void;
  onSaveNursing: (timestamp: number, notes?: string) => Promise<void>;
  onSaveNursingManual: (leftSecs: number, rightSecs: number, timestamp: number) => Promise<void>;
  // Bottle props
  onSaveBottle: (amountMl: number, timestamp: number) => Promise<void>;
  onDismiss: () => void;
}

const MAX_RETROACTIVE_MS = 12 * 60 * 60 * 1000;
const BOTTLE_PRESETS = [30, 60, 90, 120, 150, 180, 240];

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
  onAdjustFeedStart,
  onSaveNursing,
  onSaveNursingManual,
  onSaveBottle,
  onDismiss,
}) => {
  const COLORS = useTheme();
  const { units, updateUnits, timeFormat } = useSettings();

  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);

  // ─── Nursing live state ──────────────────────────────────────────────────────
  const [nursingStartTime, setNursingStartTime] = useState<number>(Date.now());
  const [showNursingPicker, setShowNursingPicker] = useState(false);
  const [nursingTimeError, setNursingTimeError] = useState('');
  const [savingNursing, setSavingNursing] = useState(false);

  // ─── Nursing manual state ────────────────────────────────────────────────────
  const [manualMode, setManualMode] = useState(false);
  const [manualLeftMins, setManualLeftMins] = useState(0);
  const [manualRightMins, setManualRightMins] = useState(0);
  const [savingManual, setSavingManual] = useState(false);

  // ─── Bottle state ────────────────────────────────────────────────────────────
  const [bottleAmountMl, setBottleAmountMl] = useState(120);
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
    setManualMode(false);
    setManualLeftMins(0);
    setManualRightMins(0);
    setSavingManual(false);
    setBottleAmountMl(120);
    setBottleStartTime(Date.now());
    setBottleTimeError('');
    setSavingBottle(false);
    setShowNursingPicker(false);
    setShowBottlePicker(false);
  };

  // ─── Nursing handlers ────────────────────────────────────────────────────────

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
    const deltaMs = nursingStartTime - ms;
    setNursingTimeError('');
    setNursingStartTime(ms);
    // Shift live timer start backwards so elapsed time reflects retroactive start
    if (deltaMs > 0 && !manualMode) onAdjustFeedStart(deltaMs);
  };

  const handleSaveNursing = async (): Promise<void> => {
    if (!hasNursingTime || savingNursing) return;
    setSavingNursing(true);
    try {
      await onSaveNursing(nursingStartTime);
    } catch (error) {
      console.error('FeedModal: failed to save nursing:', error);
      setSavingNursing(false);
    }
  };

  const adjustManualMins = (side: 'left' | 'right', delta: number): void => {
    if (side === 'left') {
      setManualLeftMins(prev => Math.max(0, Math.min(240, prev + delta)));
    } else {
      setManualRightMins(prev => Math.max(0, Math.min(240, prev + delta)));
    }
  };

  const handleSaveNursingManual = async (): Promise<void> => {
    const leftSecs = manualLeftMins * 60;
    const rightSecs = manualRightMins * 60;
    if (leftSecs < 1 && rightSecs < 1) return;
    if (savingManual) return;
    setSavingManual(true);
    try {
      await onSaveNursingManual(leftSecs, rightSecs, nursingStartTime);
    } catch (error) {
      console.error('FeedModal: failed to save manual nursing:', error);
      setSavingManual(false);
    }
  };

  // ─── Bottle handlers ─────────────────────────────────────────────────────────

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

  const handleSaveBottle = async (): Promise<void> => {
    if (savingBottle || bottleAmountMl < 1) return;
    setSavingBottle(true);
    try {
      await onSaveBottle(bottleAmountMl, bottleStartTime);
    } catch (error) {
      console.error('FeedModal: failed to save bottle:', error);
      setSavingBottle(false);
    }
  };

  const adjustAmount = (delta: number): void => {
    setBottleAmountMl(prev => Math.min(500, Math.max(5, prev + delta)));
  };

  const displayAmount =
    units === 'oz'
      ? `${(bottleAmountMl / 29.5735).toFixed(1)} oz`
      : `${bottleAmountMl} ml`;

  const nursingTime = new Date(nursingStartTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });
  const bottleTime = new Date(bottleStartTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
  });

  const manualHasTime = manualLeftMins + manualRightMins > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: COLORS.background },
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
        closeButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
        closeText: { fontSize: TYPOGRAPHY.size.lg, color: COLORS.textMuted },
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
        tab: { flex: 1, height: 44, justifyContent: 'center', alignItems: 'center' },
        tabActive: { backgroundColor: COLORS.feed },
        tabText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600', color: COLORS.feed },
        tabTextActive: { color: COLORS.surface },
        body: { flex: 1 },
        bodyContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 36 },
        startedRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          marginBottom: 20,
        },
        startedLabel: { fontSize: TYPOGRAPHY.size.sm, color: COLORS.textMuted },
        startedValue: { fontSize: TYPOGRAPHY.size.base, fontWeight: '600', color: COLORS.primary },
        errorText: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.error,
          marginTop: -12,
          marginBottom: 12,
        },
        pickerWrapper: { marginBottom: 12 },
        // ─── Mode toggle ─────────────────────────────────────────────
        modeRow: {
          flexDirection: 'row',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: COLORS.nursing,
          overflow: 'hidden',
          marginBottom: 24,
        },
        modeBtn: {
          flex: 1,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
        },
        modeBtnActive: { backgroundColor: COLORS.nursing },
        modeBtnText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600', color: COLORS.nursing },
        modeBtnTextActive: { color: COLORS.surface },
        // ─── Live nursing ────────────────────────────────────────────
        sidesRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 32 },
        sideCell: { alignItems: 'center', gap: 10 },
        sideCircle: {
          width: 120,
          height: 120,
          borderRadius: 60,
          justifyContent: 'center',
          alignItems: 'center',
        },
        sideLabel: { fontSize: TYPOGRAPHY.size.base, fontWeight: 'bold', color: COLORS.surface },
        sideTimer: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
          fontVariant: ['tabular-nums'],
        },
        // ─── Manual nursing ──────────────────────────────────────────
        manualSection: { marginBottom: 24 },
        manualSectionLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 10,
        },
        manualRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          paddingHorizontal: 8,
          height: 56,
        },
        manualNudgeBtn: {
          width: 48,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
        },
        manualNudgeBtnText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.nursing,
        },
        manualValue: {
          fontSize: TYPOGRAPHY.size.lg,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
          minWidth: 64,
          textAlign: 'center',
          fontVariant: ['tabular-nums'],
        },
        // ─── Save button ─────────────────────────────────────────────
        saveButton: {
          height: 52,
          borderRadius: 12,
          backgroundColor: COLORS.feed,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 4,
        },
        saveButtonNursing: { backgroundColor: COLORS.nursing },
        saveButtonDisabled: { opacity: 0.4 },
        saveButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        // ─── Bottle amount ───────────────────────────────────────────
        amountBadge: {
          fontSize: 40,
          fontWeight: 'bold',
          color: COLORS.bottle,
          textAlign: 'center',
          marginBottom: 16,
          fontVariant: ['tabular-nums'],
        },
        presetRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
        presetChip: {
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.bottle,
          backgroundColor: COLORS.surface,
        },
        presetChipActive: { backgroundColor: COLORS.bottle },
        presetChipText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.bottle,
        },
        presetChipTextActive: { color: COLORS.surface },
        nudgeRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 24,
        },
        nudgeBtn: {
          width: 64,
          height: 44,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: COLORS.border,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: COLORS.surface,
        },
        nudgeBtnText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textPrimary,
        },
        unitRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
        unitPill: {
          paddingHorizontal: 20,
          paddingVertical: 8,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: COLORS.feed,
        },
        unitPillActive: { backgroundColor: COLORS.feed },
        unitPillText: { fontSize: TYPOGRAPHY.size.sm, fontWeight: '600', color: COLORS.feed },
        unitPillTextActive: { color: COLORS.surface },
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Feeding</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Nursing / Bottle tab switcher */}
        <View style={styles.tabRow}>
          {(['nursing', 'bottle'] as FeedTab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'nursing' ? (
            <>
              {/* Time row — shared between live and manual modes */}
              <TouchableOpacity
                style={styles.startedRow}
                onPress={() => setShowNursingPicker(prev => !prev)}
              >
                <Text style={styles.startedLabel}>Started at</Text>
                <Text style={styles.startedValue}>Today, {nursingTime} ›</Text>
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

              {/* Live / Past session mode toggle */}
              <View style={styles.modeRow}>
                {([false, true] as const).map(isPast => (
                  <TouchableOpacity
                    key={String(isPast)}
                    style={[styles.modeBtn, manualMode === isPast && styles.modeBtnActive]}
                    onPress={() => setManualMode(isPast)}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        manualMode === isPast && styles.modeBtnTextActive,
                      ]}
                    >
                      {isPast ? 'Log past session' : 'Live track'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {manualMode ? (
                <>
                  {/* Manual duration entry for each side */}
                  {(['left', 'right'] as const).map(side => {
                    const mins = side === 'left' ? manualLeftMins : manualRightMins;
                    return (
                      <View key={side} style={styles.manualSection}>
                        <Text style={styles.manualSectionLabel}>
                          {side === 'left' ? 'Left breast' : 'Right breast'}
                        </Text>
                        <View style={styles.manualRow}>
                          {([-5, -1] as const).map(d => (
                            <TouchableOpacity
                              key={d}
                              style={styles.manualNudgeBtn}
                              onPress={() => adjustManualMins(side, d)}
                            >
                              <Text style={styles.manualNudgeBtnText}>{d} min</Text>
                            </TouchableOpacity>
                          ))}
                          <Text style={styles.manualValue}>{mins} min</Text>
                          {([1, 5] as const).map(d => (
                            <TouchableOpacity
                              key={d}
                              style={styles.manualNudgeBtn}
                              onPress={() => adjustManualMins(side, d)}
                            >
                              <Text style={styles.manualNudgeBtnText}>+{d} min</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      styles.saveButtonNursing,
                      (!manualHasTime || savingManual) && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSaveNursingManual}
                    disabled={!manualHasTime || savingManual}
                  >
                    {savingManual ? (
                      <ActivityIndicator size="small" color={COLORS.surface} />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Session</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Live L / R buttons */}
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
                              { backgroundColor: isRunning ? COLORS.active : COLORS.nursing },
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

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      styles.saveButtonNursing,
                      (!hasNursingTime || savingNursing) && styles.saveButtonDisabled,
                    ]}
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
              )}
            </>
          ) : (
            <>
              {/* Retroactive bottle time */}
              <TouchableOpacity
                style={styles.startedRow}
                onPress={() => setShowBottlePicker(prev => !prev)}
              >
                <Text style={styles.startedLabel}>Started at</Text>
                <Text style={styles.startedValue}>Today, {bottleTime} ›</Text>
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

              {/* Amount display */}
              <Text style={styles.amountBadge}>{displayAmount}</Text>

              {/* Preset quick-select */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetRow}
              >
                {BOTTLE_PRESETS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetChip, bottleAmountMl === p && styles.presetChipActive]}
                    onPress={() => setBottleAmountMl(p)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        bottleAmountMl === p && styles.presetChipTextActive,
                      ]}
                    >
                      {units === 'oz' ? `${Math.round(p / 29.5735)}oz` : `${p}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Fine-tune nudge buttons */}
              <View style={styles.nudgeRow}>
                {([-10, -5, 5, 10] as const).map(d => (
                  <TouchableOpacity key={d} style={styles.nudgeBtn} onPress={() => adjustAmount(d)}>
                    <Text style={styles.nudgeBtnText}>{d > 0 ? `+${d}` : `${d}`}</Text>
                  </TouchableOpacity>
                ))}
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

              <TouchableOpacity
                style={[styles.saveButton, savingBottle && styles.saveButtonDisabled]}
                onPress={handleSaveBottle}
                disabled={savingBottle}
              >
                {savingBottle ? (
                  <ActivityIndicator size="small" color={COLORS.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
