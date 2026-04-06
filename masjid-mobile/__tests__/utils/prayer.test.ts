import { describe, it, expect } from 'vitest';

describe('prayer utilities', () => {
  describe('currency formatting', () => {
    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    };

    it('should format amounts as USD', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(0)).toBe('$0.00');
    });
  });

  describe('date formatting', () => {
    const formatDate = (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
    };

    it('should format dates', () => {
      expect(formatDate('2024-06-15')).toContain('Jun');
      expect(formatDate(new Date(2024, 0, 15))).toContain('Jan');
    });
  });

  describe('time formatting', () => {
    const formatTime = (time: string): string => {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    it('should format times in 12-hour format', () => {
      expect(formatTime('14:30')).toBe('2:30 PM');
      expect(formatTime('06:00')).toBe('6:00 AM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
    });
  });

  describe('getNextPrayer', () => {
    const getNextPrayer = (
      prayers: { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string },
      now: Date
    ): string => {
      const timeToMinutes = (time: string): number => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const prayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

      for (const prayer of prayerOrder) {
        if (timeToMinutes(prayers[prayer]) > nowMinutes) {
          return prayer;
        }
      }
      return 'fajr';
    };

    it('should return next prayer based on time', () => {
      const prayers = {
        fajr: '05:30',
        sunrise: '06:45',
        dhuhr: '12:00',
        asr: '15:30',
        maghrib: '18:45',
        isha: '20:00',
      };

      const morning = new Date('2024-01-15T07:00:00');
      expect(getNextPrayer(prayers, morning)).toBe('dhuhr');

      const afternoon = new Date('2024-01-15T14:00:00');
      expect(getNextPrayer(prayers, afternoon)).toBe('asr');
    });
  });

  describe('calculateTimeUntil', () => {
    const calculateTimeUntil = (target: Date, now: Date): { hours: number; minutes: number } => {
      const diff = target.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return { hours, minutes };
    };

    it('should calculate time difference', () => {
      const now = new Date('2024-01-15T10:00:00');
      const target = new Date('2024-01-15T12:30:00');
      const result = calculateTimeUntil(target, now);
      
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(30);
    });
  });

  describe('getPrayerTimeStatus', () => {
    const getPrayerTimeStatus = (startTime: string, endTime: string, now: Date): 'current' | 'upcoming' | 'passed' => {
      const timeToMinutes = (time: string): number => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const start = timeToMinutes(startTime);
      const end = timeToMinutes(endTime);

      if (nowMinutes >= start && nowMinutes <= end) return 'current';
      if (nowMinutes < start) return 'upcoming';
      return 'passed';
    };

    it('should return correct status', () => {
      const midday = new Date('2024-01-15T12:15:00');
      expect(getPrayerTimeStatus('12:00', '15:30', midday)).toBe('current');

      const morning = new Date('2024-01-15T10:00:00');
      expect(getPrayerTimeStatus('12:00', '15:30', morning)).toBe('upcoming');

      const evening = new Date('2024-01-15T16:00:00');
      expect(getPrayerTimeStatus('12:00', '15:30', evening)).toBe('passed');
    });
  });
});
