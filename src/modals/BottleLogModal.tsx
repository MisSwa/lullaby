import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, TYPOGRAPHY } from '@theme/colors';

interface BottleLogModalProps {
  visible: boolean;
  prefillNotes?: string;
  onSave: (amountMl: number) => Promise<void>;
  onDismiss: () => void;
}

export const BottleLogModal: React.FC<BottleLogModalProps> = ({
  visible,
  prefillNotes,
  onSave,
  onDismiss,
}) => {
  const [amountText, setAmountText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const parsedAmount = parseFloat(amountText);
  const isValid = amountText.length > 0 && !isNaN(parsedAmount) && parsedAmount >= 1;

  const handleSave = async (): Promise<void> => {
    if (!isValid) {
      setError('Enter an amount of at least 1ml.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(parsedAmount);
      setAmountText('');
    } catch (err) {
      console.error('Failed to save bottle log:', err);
      setSaving(false);
    }
  };

  const handleDismiss = (): void => {
    setAmountText('');
    setError('');
    onDismiss();
  };

  const handleChangeText = (text: string): void => {
    setAmountText(text);
    if (error.length > 0) setError('');
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.inner}>
            <Text style={styles.title}>Log Bottle</Text>
            <Text style={styles.subtitle}>How much did they drink?</Text>

            <View style={styles.inputRow}>
              <TextInput
                style={[styles.amountInput, error.length > 0 && styles.amountInputError]}
                value={amountText}
                onChangeText={handleChangeText}
                placeholder="0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                autoFocus
                editable={!saving}
              />
              <Text style={styles.unit}>ml</Text>
            </View>

            {error.length > 0 && <Text style={styles.errorText}>{error}</Text>}

            {prefillNotes !== undefined && prefillNotes.length > 0 && (
              <Text style={styles.notePreview}>Note: {prefillNotes}</Text>
            )}

            <TouchableOpacity
              style={[styles.saveButton, (!isValid || saving) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!isValid || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleDismiss}
              disabled={saving}
            >
              <Text style={[styles.cancelButtonText, saving && styles.cancelButtonDisabled]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textMuted,
    marginBottom: 28,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountInput: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: TYPOGRAPHY.size.xl,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
    marginRight: 12,
  },
  amountInputError: {
    borderColor: COLORS.error,
  },
  unit: {
    fontSize: TYPOGRAPHY.size.xl,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    width: 32,
  },
  errorText: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.error,
    marginBottom: 12,
  },
  notePreview: {
    fontSize: TYPOGRAPHY.size.sm,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: 20,
  },
  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.feed,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
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
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textMuted,
  },
  cancelButtonDisabled: {
    opacity: 0.4,
  },
});
