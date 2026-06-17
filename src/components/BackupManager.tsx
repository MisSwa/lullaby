import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { exportSnapshot, writeBackupIOS, writeBackupAndroid } from '@services/backup';
import { getAccessToken } from '@services/driveAuth';
import { useDriveSignIn } from '@hooks/useDriveSignIn';

/**
 * Renderless component that owns the automatic backup lifecycle.
 * Must be mounted inside SQLiteProvider.
 *
 * - iOS: writes a JSON snapshot to iCloud Documents on every background transition.
 * - Android: initiates one-time Google Drive OAuth on mount, then uploads on background.
 */
export const BackupManager: React.FC = () => {
  const db = useSQLiteContext();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const { signIn } = useDriveSignIn();

  // Android: request Drive access once on first mount
  useEffect(() => {
    if (Platform.OS === 'android') {
      signIn().catch((error: unknown) => {
        console.error('BackupManager: Drive sign-in failed on mount:', error);
      });
    }
  }, [signIn]);

  // AppState listener: trigger backup whenever the app is backgrounded
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus): void => {
      const wasForegrounded =
        appStateRef.current === 'active' || appStateRef.current === 'inactive';

      if (wasForegrounded && nextState === 'background') {
        (async () => {
          try {
            const json = await exportSnapshot(db);
            if (Platform.OS === 'ios') {
              await writeBackupIOS(json);
            } else if (Platform.OS === 'android') {
              const token = getAccessToken();
              if (token) {
                await writeBackupAndroid(json, token);
              } else {
                console.warn('BackupManager: Drive backup skipped — not authenticated');
              }
            }
          } catch (error) {
            console.error('BackupManager: backup failed:', error);
          }
        })();
      }

      appStateRef.current = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [db]);

  return null;
};
