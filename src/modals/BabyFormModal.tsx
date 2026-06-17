import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';

interface BabyFormModalProps {
  mode: 'onboarding' | 'add';
  onSave: (name: string, dob: number) => Promise<void>;
  onDismiss?: () => void;
}

const yesterday = () => new Date(Date.now() - 86400000);
const threeYearsAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 3);
  return d;
};

export const BabyFormModal: React.FC<BabyFormModalProps> = ({ mode, onSave, onDismiss }) => {
  const COLORS = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
          paddingHorizontal: 24,
          paddingTop: 8,
        },
        fieldLabel: {
          fontSize: TYPOGRAPHY.size.sm,
          fontWeight: '600',
          color: COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 8,
          marginTop: 20,
        },
        nameInput: {
          height: 52,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.surface,
        },
        dateButton: {
          height: 52,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          justifyContent: 'center',
          backgroundColor: COLORS.surface,
        },
        dateButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textPrimary,
        },
        saveButton: {
          height: 52,
          borderRadius: 12,
          backgroundColor: COLORS.primary,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 32,
        },
        saveButtonDisabled: {
          backgroundColor: COLORS.primaryLight,
        },
        saveButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          fontWeight: 'bold',
          color: COLORS.surface,
        },
        cancelButton: {
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 12,
        },
        cancelButtonText: {
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textMuted,
        },
      }),
    [COLORS],
  );

  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date>(yesterday());
  const [saving, setSaving] = useState(false);
  // Android needs explicit show/hide; iOS renders inline always
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const inputRef = useRef<TextInput>(null);

  // autoFocus inside a Modal fires before the animation completes on iOS,
  // leaving the field unfocused. A short delay ensures the modal is fully
  // presented before we request focus.
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selected) {
      setDob(selected);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onSave(name.trim(), dob.getTime());
    } catch (error) {
      console.error('Failed to save baby:', error);
      setSaving(false);
    }
  };

  const saveDisabled = name.trim() === '' || saving;

  return (
    <View style={styles.container}>
      <Text style={styles.fieldLabel}>Baby name</Text>
      <TextInput
        ref={inputRef}
        style={styles.nameInput}
        value={name}
        onChangeText={setName}
        placeholder="Baby name"
        placeholderTextColor={COLORS.textMuted}
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        editable={!saving}
      />

      <Text style={styles.fieldLabel}>Date of Birth</Text>

      {Platform.OS === 'android' && !showPicker && (
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.dateButtonText}>
            {dob.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
      )}

      {showPicker && (
        <DateTimePicker
          value={dob}
          mode="date"
          display="default"
          maximumDate={yesterday()}
          minimumDate={threeYearsAgo()}
          onChange={handleDateChange}
        />
      )}

      <TouchableOpacity
        style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saveDisabled}
      >
        {saving ? (
          <ActivityIndicator size="small" color={COLORS.surface} />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>

      {mode === 'add' && (
        <TouchableOpacity style={styles.cancelButton} onPress={onDismiss}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
