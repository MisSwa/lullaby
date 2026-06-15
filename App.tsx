import React, { Suspense } from 'react';
import { ActivityIndicator, SafeAreaView, View, StyleSheet } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '@services/db';
import { TrackerProvider } from '@context/TrackerContext';
import { SettingsProvider } from '@context/SettingsContext';
import { COLORS } from '@theme/colors';

function LoadingFallback(): React.ReactElement {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function App(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SQLiteProvider databaseName="lullaby_local.db" onInit={initializeDatabase}>
        <TrackerProvider>
          <SettingsProvider>
            <SafeAreaView style={styles.root} />
          </SettingsProvider>
        </TrackerProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
