import React, { useMemo, useState } from 'react';
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
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';

interface SolidsModalProps {
  visible: boolean;
  onSave: (notes: string) => Promise<void>;
  onDismiss: () => void;
}

export const SolidsModal: React.FC<SolidsModalProps> = ({ visible, onSave, onDismiss }) => {
  const COLORS = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          marginBottom: 28,
        },
        notesInput: {
          height: 120,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingTop: 14,
          fontSize: TYPOGRAPHY.size.base,
          color: COLORS.textPrimary,
          backgroundColor: COLORS.surface,
          marginBottom: 20,
        },
        saveButton: {
          height: 52,
          borderRadius: 12,
          backgroundColor: COLORS.primary,
          justifyContent: 'center',
          alignItems: 'center',
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
      }),
    [COLORS],
  );

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await onSave(notes.trim());
      setNotes('');
    } catch (error) {
      console.error('Failed to save solids log:', error);
      setSaving(false);
    }
  };

  const handleDismiss = (): void => {
    setNotes('');
    onDismiss();
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <SafeAreaView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.inner}>
            <Text style={styles.title}>Log Solids</Text>

            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="What did they eat? (optional)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={200}
              editable={!saving}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
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
