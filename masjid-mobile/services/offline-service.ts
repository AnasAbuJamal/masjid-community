import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@masjid:cache:';
const DEFAULT_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class OfflineService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      if (Date.now() - entry.timestamp > entry.ttl) {
        await this.remove(key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.error('Error removing cached data:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCachedKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys.filter(k => k.startsWith(CACHE_PREFIX)).map(k => k.replace(CACHE_PREFIX, ''));
    } catch {
      return [];
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;
