import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundTask from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import apiService from './api-service';
import offlineService from './offline-service';

const SYNC_TASK_NAME = 'masjid-data-sync';
const LAST_SYNC_KEY = '@masjid:last_sync';

interface SyncResult {
  success: boolean;
  timestamp: number;
  dataTypes: string[];
}

class SyncService {
  private isRegistered: boolean = false;

  async registerBackgroundSync(): Promise<void> {
    try {
      await BackgroundTask.registerTaskAsync(SYNC_TASK_NAME, {
        minimumInterval: 60 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      this.isRegistered = true;
      console.log('Background sync registered');
    } catch (error) {
      console.log('Failed to register background sync:', error);
    }
  }

  async unregisterBackgroundSync(): Promise<void> {
    try {
      await BackgroundTask.unregisterTaskAsync(SYNC_TASK_NAME);
      this.isRegistered = false;
    } catch (error) {
      console.log('Failed to unregister background sync:', error);
    }
  }

  async syncAllData(): Promise<SyncResult> {
    const dataTypes: string[] = [];
    const timestamp = Date.now();

    try {
      const [
        prayers,
        announcements,
        jobs,
        volunteers,
      ] = await Promise.all([
        apiService.prayers.getToday().catch(() => null),
        apiService.announcements.getAll().catch(() => []),
        apiService.jobs.getAll().catch(() => []),
        apiService.volunteers.getOpportunities().catch(() => []),
      ]);

      if (prayers) {
        await offlineService.set('prayers_today', prayers, 60 * 60 * 1000);
        dataTypes.push('prayers');
      }

      if (announcements) {
        await offlineService.set('announcements', announcements, 60 * 60 * 1000);
        dataTypes.push('announcements');
      }

      if (jobs) {
        await offlineService.set('jobs', jobs, 60 * 60 * 1000);
        dataTypes.push('jobs');
      }

      if (volunteers) {
        await offlineService.set('volunteers', volunteers, 60 * 60 * 1000);
        dataTypes.push('volunteers');
      }

      await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());

      return { success: true, timestamp, dataTypes };
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: false, timestamp, dataTypes };
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return timestamp ? new Date(parseInt(timestamp)) : null;
  }

  async getOfflineData<T>(key: string): Promise<T | null> {
    return await offlineService.get<T>(key);
  }

  isSyncRegistered(): boolean {
    return this.isRegistered;
  }
}

export const syncService = new SyncService();
export default syncService;

TaskManager.defineTask(SYNC_TASK_NAME, async () => {
  const result = await syncService.syncAllData();
  return result.success ? BackgroundTask.BackgroundFetchResult.NewData : BackgroundTask.BackgroundFetchResult.Failed;
});
