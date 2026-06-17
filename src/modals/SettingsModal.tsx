import React, { useMemo, useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  Switch,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { useTracker } from '@context/TrackerContext';
import { useSettings } from '@context/SettingsContext';
import { useTheme } from '@hooks/useTheme';
import { LIGHT, TYPOGRAPHY } from '@theme/colors';
import { AppTheme, AppUnits, AppTimeFormat, NotificationType } from '../types/tracker';
import { Baby } from '../types/baby';
import { BabyFormModal } from './BabyFormModal';
import { computeAge } from '../utils/ageString';

// ─── Avatar helpers (same palette as DashboardHeader) ────────────────────────

const AVATAR_PALETTE = [
  LIGHT.primary,
  LIGHT.sleep,
  LIGHT.feed,
  LIGHT.diaper,
  LIGHT.active,
  LIGHT.textMuted,
];

function avatarColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

// ─── Constants ────────────────────────────────────────────────────────────────

// TODO: replace with the real privacy policy URL before shipping
const PRIVACY_POLICY_URL = 'https://lullabybaby.app/privacy';
const APP_VERSION = '1.0.0';

// ─── SegmentedControl ─────────────────────────────────────────────────────────

interface SegOpt {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegOpt[];
  selected: string;
  onSelect: (v: string) => void;
  accentColor: string;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selected,
  onSelect,
  accentColor,
}) => {
  const COLORS = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 8,
          overflow: 'hidden',
        },
        seg: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 36,
        },
        segActive: {
          backgroundColor: accentColor,
        },
        segText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textMuted,
        },
        segTextActive: {
          color: COLORS.surface,
        },
        divider: {
          width: 1,
          backgroundColor: COLORS.border,
        },
      }),
    [COLORS, accentColor],
  );

  return (
    <View style={styles.container}>
      {options.map((opt, idx) => (
        <React.Fragment key={opt.value}>
          {idx > 0 && <View style={styles.divider} />}
          <TouchableOpacity
            style={[styles.seg, opt.value === selected && styles.segActive]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.segText, opt.value === selected && styles.segTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </View>
  );
};

// ─── NotifSection ─────────────────────────────────────────────────────────────

interface NotifSectionProps {
  label: string;
  type: NotificationType;
}

const NotifSection: React.FC<NotifSectionProps> = ({ label, type }) => {
  const COLORS = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: 10,
          paddingHorizontal: 16,
          paddingVertical: 4,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 52,
        },
        sectionLabel: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '600',
          color: COLORS.textPrimary,
        },
        thresholdRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingBottom: 14,
          gap: 8,
        },
        thresholdLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
        },
        thresholdInput: {
          width: 56,
          height: 44,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 8,
          paddingHorizontal: 10,
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.background,
          textAlign: 'center',
        },
        thresholdUnit: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
        },
      }),
    [COLORS],
  );

  const { notifications, updateNotificationPref } = useSettings();
  const pref = notifications[type];
  const [hoursText, setHoursText] = useState<string>(String(pref.thresholdMinutes / 60));

  const handleToggle = (value: boolean): void => {
    updateNotificationPref(type, { enabled: value }).catch(error => {
      console.error(`Failed to toggle ${type} notification:`, error);
    });
  };

  const handleHoursChange = (text: string): void => {
    setHoursText(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      const minutes = Math.round(parsed * 60);
      updateNotificationPref(type, { thresholdMinutes: minutes }).catch(error => {
        console.error(`Failed to update ${type} threshold:`, error);
      });
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <Switch
          value={pref.enabled}
          onValueChange={handleToggle}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor={COLORS.surface}
        />
      </View>
      {pref.enabled && (
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Remind after</Text>
          <TextInput
            style={styles.thresholdInput}
            value={hoursText}
            onChangeText={handleHoursChange}
            keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
            selectTextOnFocus
            maxLength={4}
          />
          <Text style={styles.thresholdUnit}>hour(s)</Text>
        </View>
      )}
    </View>
  );
};

// ─── SettingsModal ─────────────────────────────────────────────────────────────

interface SettingsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

type BabyFormState =
  | { mode: 'edit'; baby: Baby }
  | { mode: 'add' }
  | null;

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onDismiss }) => {
  const COLORS = useTheme();
  const { babies, createBaby, updateBaby } = useTracker();
  const { theme, updateTheme, units, updateUnits, timeFormat, updateTimeFormat } = useSettings();
  const [babyFormState, setBabyFormState] = useState<BabyFormState>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: COLORS.background,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        title: {
          fontSize: TYPOGRAPHY.size.xl,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        closeButton: {
          minWidth: 44,
          minHeight: 44,
          justifyContent: 'center',
          alignItems: 'flex-end',
        },
        closeButtonText: {
          fontSize: TYPOGRAPHY.size.lg,
          color: COLORS.textMuted,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 32,
        },
        sectionLabel: {
          fontSize: TYPOGRAPHY.size.xs,
          fontWeight: 'bold',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 8,
          marginTop: 4,
        },
        card: {
          backgroundColor: COLORS.surface,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: 24,
          overflow: 'hidden',
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: 52,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        rowLast: {
          borderBottomWidth: 0,
        },
        rowLabel: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '500',
          color: COLORS.textPrimary,
          flex: 1,
        },
        rowValue: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textMuted,
        },
        rowChevron: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textMuted,
          marginLeft: 8,
        },
        babyRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          gap: 12,
          minHeight: 60,
        },
        avatar: {
          width: 36,
          height: 36,
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
        },
        avatarText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        babyInfo: {
          flex: 1,
        },
        babyName: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '600',
          color: COLORS.textPrimary,
        },
        babyAge: {
          fontSize: TYPOGRAPHY.size.xs,
          color: COLORS.textMuted,
          marginTop: 2,
        },
        editButton: {
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
          minWidth: 60,
          minHeight: 36,
          justifyContent: 'center',
          alignItems: 'center',
        },
        editButtonText: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.primary,
        },
        addChildRow: {
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: 52,
          justifyContent: 'center',
        },
        addChildText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: '600',
          color: COLORS.primary,
        },
        aboutText: {
          fontSize: TYPOGRAPHY.size.sm,
          color: COLORS.textMuted,
          lineHeight: 20,
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        footer: {
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        doneButton: {
          height: 52,
          borderRadius: 12,
          backgroundColor: COLORS.primary,
          justifyContent: 'center',
          alignItems: 'center',
        },
        doneButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        // Baby form modal styles
        formTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        formTitle: {
          fontSize: TYPOGRAPHY.size.xl,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
      }),
    [COLORS],
  );

  const handleSaveBabyForm = async (name: string, dob: number): Promise<void> => {
    if (babyFormState?.mode === 'edit') {
      await updateBaby(babyFormState.baby.id, name, dob);
    } else {
      await createBaby(name, dob);
    }
    setBabyFormState(null);
  };

  const handlePrivacyPress = (): void => {
    Linking.openURL(PRIVACY_POLICY_URL).catch(err => {
      console.error('Failed to open privacy policy URL:', err);
    });
  };

  return (
    <>
      <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onDismiss}>
        <SafeAreaView style={styles.root}>
          {/* Header */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

            {/* ── Babies ─────────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Babies</Text>
            <View style={styles.card}>
              {babies.length === 0 ? (
                <View style={[styles.babyRow, styles.rowLast]}>
                  <Text style={styles.rowValue}>No babies added yet.</Text>
                </View>
              ) : (
                babies.map((baby, idx) => (
                  <View
                    key={baby.id}
                    style={[styles.babyRow, idx === babies.length - 1 && styles.rowLast]}
                  >
                    <View style={[styles.avatar, { backgroundColor: avatarColor(baby.name) }]}>
                      <Text style={styles.avatarText}>{baby.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.babyInfo}>
                      <Text style={styles.babyName}>{baby.name}</Text>
                      <Text style={styles.babyAge}>{computeAge(baby.dob)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => setBabyFormState({ mode: 'edit', baby })}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
              <TouchableOpacity
                style={styles.addChildRow}
                onPress={() => setBabyFormState({ mode: 'add' })}
              >
                <Text style={styles.addChildText}>+ Add Child</Text>
              </TouchableOpacity>
            </View>

            {/* ── Preferences ────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Preferences</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Theme</Text>
                <SegmentedControl
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'System', value: 'system' },
                    { label: 'Dark', value: 'dark' },
                  ]}
                  selected={theme}
                  onSelect={v => {
                    updateTheme(v as AppTheme).catch(err =>
                      console.error('Failed to update theme:', err),
                    );
                  }}
                  accentColor={COLORS.primary}
                />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Units</Text>
                <SegmentedControl
                  options={[
                    { label: 'ml', value: 'ml' },
                    { label: 'oz', value: 'oz' },
                  ]}
                  selected={units}
                  onSelect={v => {
                    updateUnits(v as AppUnits).catch(err =>
                      console.error('Failed to update units:', err),
                    );
                  }}
                  accentColor={COLORS.primary}
                />
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>Time Format</Text>
                <SegmentedControl
                  options={[
                    { label: '12h', value: '12h' },
                    { label: '24h', value: '24h' },
                  ]}
                  selected={timeFormat}
                  onSelect={v => {
                    updateTimeFormat(v as AppTimeFormat).catch(err =>
                      console.error('Failed to update time format:', err),
                    );
                  }}
                  accentColor={COLORS.primary}
                />
              </View>
            </View>

            {/* ── Notifications ──────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Notifications</Text>
            <NotifSection label="Feed Reminders" type="feed" />
            <NotifSection label="Diaper Reminders" type="diaper" />
            <NotifSection label="Sleep Reminders" type="sleep" />

            {/* ── About ──────────────────────────────────────────── */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>About</Text>
            <View style={styles.card}>
              <Text style={styles.aboutText}>
                Your data is stored locally on this device. Nothing leaves your phone.
              </Text>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Version</Text>
                <Text style={styles.rowValue}>{APP_VERSION}</Text>
              </View>
              <TouchableOpacity
                style={[styles.row, styles.rowLast]}
                onPress={handlePrivacyPress}
              >
                <Text style={styles.rowLabel}>Privacy Policy</Text>
                <Text style={styles.rowChevron}>›</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.doneButton} onPress={onDismiss}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Baby form nested modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={babyFormState !== null}
        onRequestClose={() => setBabyFormState(null)}
      >
        <SafeAreaView style={styles.root}>
          <View style={styles.formTitleRow}>
            <Text style={styles.formTitle}>
              {babyFormState?.mode === 'edit' ? 'Edit Baby' : 'Add Child'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setBabyFormState(null)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          {babyFormState !== null && (
            <BabyFormModal
              key={babyFormState.mode === 'edit' ? babyFormState.baby.id : 'new'}
              mode={babyFormState.mode}
              initialName={babyFormState.mode === 'edit' ? babyFormState.baby.name : undefined}
              initialDob={babyFormState.mode === 'edit' ? babyFormState.baby.dob : undefined}
              onSave={handleSaveBabyForm}
              onDismiss={() => setBabyFormState(null)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};
