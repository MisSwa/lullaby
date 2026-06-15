import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { DashboardHeader } from './DashboardHeader';
import { AddBabyModal } from '@modals/AddBabyModal';
import { COLORS, TYPOGRAPHY } from '@theme/colors';

export const Dashboard: React.FC = () => {
  const [showAddBaby, setShowAddBaby] = useState(false);

  return (
    <SafeAreaView style={styles.root}>
      <DashboardHeader onAddBaby={() => setShowAddBaby(true)} />

      <View style={styles.body}>
        <Text style={styles.placeholder}>Ready to track.</Text>
      </View>

      <AddBabyModal visible={showAddBaby} onDismiss={() => setShowAddBaby(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: TYPOGRAPHY.size.base,
    color: COLORS.textMuted,
  },
});
