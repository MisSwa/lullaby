import { useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { NotificationType } from '../types/tracker';

export function useNotifications(): {
  scheduleReminder: (
    type: NotificationType,
    thresholdMinutes: number,
    babyName?: string,
  ) => Promise<void>;
  cancelReminder: (type: NotificationType) => Promise<void>;
} {
  const identifiers = useRef<Partial<Record<NotificationType, string>>>({});

  const cancelReminder = useCallback(async (type: NotificationType): Promise<void> => {
    const id = identifiers.current[type];
    if (!id) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error(`Failed to cancel ${type} reminder:`, error);
    }
    delete identifiers.current[type];
  }, []);

  const scheduleReminder = useCallback(
    async (type: NotificationType, thresholdMinutes: number, babyName?: string): Promise<void> => {
      await cancelReminder(type);

      const hours = thresholdMinutes / 60;
      const hoursDisplay = Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
      const nameTag = babyName ? ` — ${babyName}` : '';

      let title: string;
      let body: string;

      switch (type) {
        case 'feed':
          title = `Feed reminder${nameTag}`;
          body = `It's been ${hoursDisplay}h since the last feed.`;
          break;
        case 'diaper':
          title = `Diaper reminder${nameTag}`;
          body = `It's been ${hoursDisplay}h since the last diaper change.`;
          break;
        case 'sleep':
          title = `Sleep reminder${nameTag}`;
          body = `${babyName ?? 'Baby'} has been asleep for ${hoursDisplay}h.`;
          break;
        default: {
          const _exhaustive: never = type;
          throw new Error(`Unhandled notification type: ${JSON.stringify(_exhaustive)}`);
        }
      }

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: { title, body },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: thresholdMinutes * 60,
            repeats: false,
          },
        });
        identifiers.current[type] = id;
      } catch (error) {
        console.error(`Failed to schedule ${type} reminder:`, error);
      }
    },
    [cancelReminder],
  );

  return { scheduleReminder, cancelReminder };
}
