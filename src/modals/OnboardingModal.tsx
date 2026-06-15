import React from 'react';
import { Modal, View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useTracker } from '@context/TrackerContext';
import { BabyFormModal } from './BabyFormModal';
import { COLORS, TYPOGRAPHY } from '@theme/colors';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onComplete }) => {
  const { createBaby } = useTracker();

  const handleSave = async (name: string, dob: number): Promise<void> => {
    await createBaby(name, dob);
    // Request notification permission after first baby is saved — fire and forget
    Notifications.requestPermissionsAsync().catch(error => {
      console.error('Failed to request notification permission:', error);
    });
    onComplete();
  };

  return (
    <Modal animationType="fade" transparent={false} visible={visible} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <Text style={styles.appName}>Lullaby</Text>
          <Text style={styles.tagline}>Set up your first baby profile to get started.</Text>
          <BabyFormModal mode="onboarding" onSave={handleSave} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    paddingTop: 80,
    alignItems: 'center',
  },
  appName: {
    fontSize: TYPOGRAPHY.size.title,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  tagline: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 8,
  },
});
