import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import apiService, { PrayerTimes } from '../../services/api-service';

const { width } = Dimensions.get('window');
const DAY_SIZE = (width - SPACING.md * 2 - SPACING.sm * 12) / 7;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function PrayerCalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes[]>([]);
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date; isCurrentMonth: boolean }>>([]);

  useEffect(() => {
    loadPrayerTimes();
    generateCalendarDays();
  }, [currentDate]);

  const loadPrayerTimes = async () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const times = await apiService.prayers.getMonth(month, year);
    setPrayerTimes(times);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    setCalendarDays(days);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getPrayerForDate = (date: Date): PrayerTimes | undefined => {
    const key = formatDateKey(date);
    return prayerTimes.find(p => p.date === key);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const selectedPrayer = selectedDate 
    ? prayerTimes.find(p => p.date === selectedDate) 
    : null;

  const renderDay = ({ item, index }: { item: { date: Date; isCurrentMonth: boolean }; index: number }) => {
    const dateKey = formatDateKey(item.date);
    const hasPrayer = getPrayerForDate(item.date);
    const isSelected = selectedDate === dateKey;

    return (
      <TouchableOpacity
        style={[
          styles.dayCell,
          !item.isCurrentMonth && styles.dayCellOther,
          isToday(item.date) && styles.dayCellToday,
          isSelected && styles.dayCellSelected,
        ]}
        onPress={() => hasPrayer && setSelectedDate(dateKey)}
        activeOpacity={hasPrayer ? 0.7 : 1}
        disabled={!hasPrayer}
      >
        <Text
          style={[
            styles.dayText,
            !item.isCurrentMonth && styles.dayTextOther,
            isToday(item.date) && styles.dayTextToday,
            isSelected && styles.dayTextSelected,
          ]}
        >
          {item.date.getDate()}
        </Text>
        {hasPrayer && (
          <View style={[styles.prayerDot, isSelected && styles.prayerDotSelected]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prayer Calendar</Text>
      </View>

      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Day Headers */}
      <View style={styles.weekHeader}>
        {DAYS.map(day => (
          <View key={day} style={styles.weekDay}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <FlatList
        data={calendarDays}
        renderItem={renderDay}
        keyExtractor={(item, index) => index.toString()}
        numColumns={7}
        scrollEnabled={false}
        contentContainerStyle={styles.calendarGrid}
      />

      {/* Selected Day Prayer Times */}
      {selectedPrayer && (
        <View style={styles.prayerCard}>
          <Text style={styles.prayerCardTitle}>
            {new Date(selectedPrayer.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <View style={styles.prayerList}>
            <PrayerRow name="Fajr" time={selectedPrayer.fajr} icon="weather-sunset-up" />
            <PrayerRow name="Sunrise" time={selectedPrayer.sunrise} icon="weather-sunset" />
            <PrayerRow name="Dhuhr" time={selectedPrayer.dhuhr} icon="weather-sunset-down" />
            <PrayerRow name="Asr" time={selectedPrayer.asr} icon="white-balance-sunny" />
            <PrayerRow name="Maghrib" time={selectedPrayer.maghrib} icon="weather-night" />
            <PrayerRow name="Isha" time={selectedPrayer.isha} icon="weather-night" />
            <PrayerRow name="Jummah 1" time={selectedPrayer.jummah1} icon="mosque" />
            <PrayerRow name="Jummah 2" time={selectedPrayer.jummah2} icon="mosque" />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function PrayerRow({ name, time, icon }: { name: string; time: string; icon: string }) {
  return (
    <View style={styles.prayerRow}>
      <View style={styles.prayerRowLeft}>
        <MaterialCommunityIcons name={icon as any} size={20} color={COLORS.primary} />
        <Text style={styles.prayerName}>{name}</Text>
      </View>
      <Text style={styles.prayerTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  navButton: {
    padding: SPACING.xs,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  weekDay: {
    width: DAY_SIZE,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  calendarGrid: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: RADIUS.md,
  },
  dayCellOther: {
    opacity: 0.4,
  },
  dayCellToday: {
    backgroundColor: COLORS.primary + '20',
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dayTextOther: {
    color: COLORS.textLight,
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  prayerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  prayerDotSelected: {
    backgroundColor: COLORS.white,
  },
  prayerCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
    ...SHADOWS.lg,
  },
  prayerCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  prayerList: {
    gap: SPACING.sm,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  prayerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  prayerTime: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
