import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/theme';

export const prayerService = {
  getToday: async () => ({
    fajr: '05:45', sunrise: '07:10', dhuhr: '12:30', asr: '15:45', maghrib: '18:00', isha: '19:30', jummah1: '13:00', jummah2: '14:00',
  }),
  getWeek: async () => [],
};

export const announcementService = {
  getAll: async () => [
    { id: '1', title: 'Ramadan Mubarak!', message: 'Wishing our community a blessed Ramadan', type: 'ramadan' },
    { id: '2', title: 'Youth Registration Open', message: 'Register for summer programs', type: 'general' },
  ],
};

export const jobService = {
  getAll: async () => [
    { id: '1', title: 'Part-Time Electrician', company: 'Al-Noor Electric', description: 'Looking for licensed electrician', location: 'Atlanta, GA', employmentType: 'part_time', salaryMin: 25, salaryMax: 40, status: 'active', isUrgent: true },
  ],
};

export const communityService = {
  getVolunteerOpportunities: async () => [
    { id: '1', title: 'Ramadan Iftar Preparation', description: 'Help prepare iftar meals', eventDate: '2026-03-15', spotsTotal: 20, spotsFilled: 8, status: 'open' },
  ],
  getProposals: async () => [],
};

export const schoolService = {
  getStudents: async () => [],
  getAssignments: async () => [],
};
