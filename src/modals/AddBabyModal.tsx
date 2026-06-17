import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useTracker } from '@context/TrackerContext';
import { useTheme } from '@hooks/useTheme';
import { TYPOGRAPHY } from '@theme/colors';
import { BabyFormModal } from './BabyFormModal';

interface AddBabyModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const AddBabyModal: React.FC<AddBabyModalProps> = ({ visible, onDismiss }) => {
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
          paddingTop: 32,
        },
        title: {
          fontSize: TYPOGRAPHY.size.xl,
          fontWeight: 'bold',
          color: COLORS.textPrimary,
          paddingHorizontal: 24,
          marginBottom: 8,
        },
      }),
    [COLORS],
  );

  const { createBaby } = useTracker();

  const handleSave = async (name: string, dob: number): Promise<void> => {
    await createBaby(name, dob);
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
            <Text style={styles.title}>Add Baby</Text>
            <BabyFormModal mode="add" onSave={handleSave} onDismiss={onDismiss} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
