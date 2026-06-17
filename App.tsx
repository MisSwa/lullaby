import React, { Suspense } from 'react';
import { ActivityIndicator, View, Text, ScrollView, StyleSheet } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { initializeDatabase } from '@services/db';
import { TrackerProvider } from '@context/TrackerContext';
import { SettingsProvider } from '@context/SettingsContext';
import { AppShell } from '@screens/AppShell';
import { BackupManager } from '@components/BackupManager';
import { COLORS } from '@theme/colors';

// ─── Error Boundary ──────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('AppErrorBoundary caught:', error, info.componentStack);
  }

  override render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={styles.errorRoot}>
          <ScrollView contentContainerStyle={styles.errorScroll}>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>{this.state.error.message}</Text>
            <Text style={styles.errorStack}>{this.state.error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

// ─── Loading Fallback ─────────────────────────────────────────────────────────

function LoadingFallback(): React.ReactElement {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function App(): React.ReactElement {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <SQLiteProvider databaseName="lullaby_local.db" onInit={initializeDatabase}>
          <SettingsProvider>
            <TrackerProvider>
              <BackupManager />
              <AppShell />
            </TrackerProvider>
          </SettingsProvider>
        </SQLiteProvider>
      </Suspense>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorRoot: {
    flex: 1,
    backgroundColor: '#1a0000',
  },
  errorScroll: {
    padding: 24,
    paddingTop: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 15,
    color: '#FFCCCC',
    marginBottom: 16,
    fontWeight: '600',
  },
  errorStack: {
    fontSize: 11,
    color: '#FF9999',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
