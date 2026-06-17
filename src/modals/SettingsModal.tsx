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
} from 'react-native';
import { useSettings } from '@context/SettingsContext';
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';
import { NotificationType } from '../types/tracker';

interface SettingsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

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
          marginBottom: 12,
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

  // Local text state so the user can edit without every keystroke hitting context
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

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onDismiss }) => {
  const COLORS = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: COLORS.background,
        },
        titleRow: {
          paddingHorizontal: 24,
          paddingTop: 24,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          backgroundColor: COLORS.surface,
        },
        title: {
          fontSize: TYPOGRAPHY.size.xl,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          paddingVertical: 16,
          paddingHorizontal: 24,
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
      }),
    [COLORS],
  );

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <SafeAreaView style={styles.root}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <NotifSection label="Feed Reminders" type="feed" />
          <NotifSection label="Diaper Reminders" type="diaper" />
          <NotifSection label="Sleep Reminders" type="sleep" />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={onDismiss}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
