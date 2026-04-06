import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import apiService from './api-service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationConfig {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for notifications');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayers', {
        name: 'Prayer Times',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90D9',
      });

      await Notifications.setNotificationChannelAsync('announcements', {
        name: 'Announcements',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync('donations', {
        name: 'Donations',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync('attendance', {
        name: 'Attendance Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF9800',
      });

      await Notifications.setNotificationChannelAsync('school', {
        name: 'School Updates',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync();
      this.expoPushToken = token;
      
      if (apiService && apiService.notifications) {
        await apiService.notifications.registerDevice(token);
      }
      
      return token;
    } catch (error) {
      console.log('Error getting push token:', error);
      return null;
    }
  }

  async schedulePrayerNotifications(prayerTimes: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  }): Promise<void> {
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const [hours, minutes] = prayer.time.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${prayer.name} Prayer`,
          body: `Assalamu Alaikum! It is time for ${prayer.name} prayer.`,
          data: { type: 'prayer', prayer: prayer.name },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
          channelId: 'prayers',
        },
      });
    }
  }

  async cancelAllPrayerNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async sendLocalNotification(config: NotificationConfig): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        data: config.data,
        sound: 'default',
      },
      trigger: null,
    });
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async sendAttendanceAlert(childName: string, className: string, status: string): Promise<string> {
    const title = status === 'absent' 
      ? `⚠️ Absence Alert: ${childName}` 
      : `📋 Attendance Update: ${childName}`;
    
    const body = status === 'absent'
      ? `${childName} was marked absent for ${className}. Please contact the school if this is an error.`
      : `${childName}'s attendance for ${className} has been updated to: ${status}`;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'attendance', childName, className, status },
        sound: status === 'absent' ? 'default' : undefined,
      },
      trigger: null,
    });
  }

  async sendGradeNotification(childName: string, assignmentTitle: string, grade: string): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `📊 New Grade: ${childName}`,
        body: `${childName} received a grade of ${grade} on "${assignmentTitle}"`,
        data: { type: 'grade', childName, assignmentTitle, grade },
        sound: 'default',
      },
      trigger: null,
    });
  }

  async sendPaymentReminder(childName: string, amount: number, dueDate: string): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `💰 Payment Due: ${childName}`,
        body: `Payment of $${amount} for ${childName} is due on ${dueDate}`,
        data: { type: 'payment', childName, amount, dueDate },
        sound: 'default',
      },
      trigger: null,
    });
  }

  async sendAssignmentReminder(childName: string, assignmentTitle: string, dueDate: string): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: `📝 Assignment Due: ${assignmentTitle}`,
        body: `${childName} has an assignment "${assignmentTitle}" due on ${dueDate}`,
        data: { type: 'assignment', childName, assignmentTitle, dueDate },
        sound: 'default',
      },
      trigger: null,
    });
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
