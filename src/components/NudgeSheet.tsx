import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { SplitButtonRow } from './SplitButtonRow';

interface NudgeSheetProps {
  visible: boolean;
  logType: 'sleep' | 'feed' | 'diaper' | 'solids';
  onSkip: () => void;
  onSetupReminders: () => void;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<NudgeSheetProps['logType'], IoniconName> = {
  sleep: 'moon',
  feed: 'restaurant',
  diaper: 'water',
  solids: 'leaf',
};

function titleForType(logType: NudgeSheetProps['logType']): string {
  switch (logType) {
    case 'sleep': return 'First sleep logged!';
    case 'feed': return 'First feed logged!';
    case 'diaper': return 'First diaper logged!';
    case 'solids': return 'First solids logged!';
  }
}

export const NudgeSheet: React.FC<NudgeSheetProps> = ({
  visible,
  logType,
  onSkip,
  onSetupReminders,
}) => {
  const COLORS = useTheme();

  const categoryColor = (): string => {
    switch (logType) {
      case 'sleep': return COLORS.sleep;
      case 'feed': return COLORS.feed;
      case 'diaper': return COLORS.diaper;
      case 'solids': return COLORS.solids;
    }
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    sheet: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 28,
      paddingBottom: 40,
    },
    icon: {
      marginBottom: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.textPrimary,
      marginBottom: 8,
    },
    body: {
      fontSize: 15,
      color: COLORS.textMuted,
      marginBottom: 28,
    },
  });

  return (
    <Modal animationType="slide" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Ionicons
            name={ICON_MAP[logType]}
            size={40}
            color={categoryColor()}
            style={styles.icon}
          />
          <Text style={styles.title}>{titleForType(logType)}</Text>
          <Text style={styles.body}>Set up a reminder so you never miss one.</Text>
          <SplitButtonRow
            leftLabel="Skip"
            rightLabel="Set up reminders"
            onLeftPress={onSkip}
            onRightPress={onSetupReminders}
          />
        </View>
      </View>
    </Modal>
  );
};
