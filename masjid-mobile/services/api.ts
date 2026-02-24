/**
 * API Service Layer
 * Currently using mock data. Replace with real API calls when backend is ready.
 * Base URL is configured via EXPO_PUBLIC_API_URL env variable.
 */

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah1: string;
  jummah2: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'ramadan' | 'urgent' | 'event';
  date?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'volunteer';
  salaryMin?: number;
  salaryMax?: number;
  status: 'active' | 'closed';
  isUrgent?: boolean;
  contactEmail?: string;
  postedAt?: string;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  eventDate?: string;
  spotsTotal: number;
  spotsFilled: number;
  status: 'open' | 'closed' | 'cancelled';
}

// ─────────────────────────────────────────
// Prayer Service
// ─────────────────────────────────────────
export const prayerService = {
  getToday: async (): Promise<PrayerTimes> => ({
    fajr: '05:45',
    sunrise: '07:10',
    dhuhr: '12:30',
    asr: '15:45',
    maghrib: '18:00',
    isha: '19:30',
    jummah1: '13:00',
    jummah2: '14:00',
  }),

  getWeek: async (): Promise<PrayerTimes[]> => [],
};

// ─────────────────────────────────────────
// Announcement Service
// ─────────────────────────────────────────
export const announcementService = {
  getAll: async (): Promise<Announcement[]> => [
    {
      id: '1',
      title: 'Ramadan Mubarak!',
      message:
        'Wishing our entire community a blessed and joyful Ramadan. May Allah accept all your prayers and fasting.',
      type: 'ramadan',
      date: 'March 1, 2026',
    },
    {
      id: '2',
      title: 'Youth Summer Registration Open',
      message:
        'Registration is now open for summer Islamic school programs. Limited spots available for ages 6-17.',
      type: 'general',
      date: 'February 20, 2026',
    },
    {
      id: '3',
      title: 'Masjid Expansion Fundraiser',
      message:
        'We are launching Phase 2 of our expansion project. Your generous donations will help build more capacity for our community.',
      type: 'event',
      date: 'February 15, 2026',
    },
  ],

  getById: async (id: string): Promise<Announcement | null> => {
    const all = await announcementService.getAll();
    return all.find((a) => a.id === id) ?? null;
  },
};

// ─────────────────────────────────────────
// Job Service
// ─────────────────────────────────────────
export const jobService = {
  getAll: async (): Promise<Job[]> => [
    {
      id: '1',
      title: 'Part-Time Electrician',
      company: 'Al-Noor Electric',
      description:
        'Looking for a licensed electrician for commercial & residential projects in the Atlanta metro area.',
      location: 'Atlanta, GA',
      employmentType: 'part_time',
      salaryMin: 25,
      salaryMax: 40,
      status: 'active',
      isUrgent: true,
      contactEmail: 'careers@alnoor.com',
      postedAt: '2026-02-20',
    },
    {
      id: '2',
      title: 'Halal Catering Manager',
      company: 'Barakah Catering Co.',
      description:
        'Experienced catering manager needed to oversee events and ensure halal compliance.',
      location: 'Marietta, GA',
      employmentType: 'full_time',
      salaryMin: 45000,
      salaryMax: 60000,
      status: 'active',
      contactEmail: 'jobs@barakahcatering.com',
      postedAt: '2026-02-18',
    },
    {
      id: '3',
      title: 'Arabic Teacher',
      company: 'Masjid Al-Momineen School',
      description:
        'Seeking a qualified Arabic language teacher for our weekend Islamic school. Must have MSA and Quranic Arabic proficiency.',
      location: 'On-site, Atlanta GA',
      employmentType: 'part_time',
      salaryMin: 20,
      salaryMax: 30,
      status: 'active',
      contactEmail: 'school@almomineen.org',
      postedAt: '2026-02-15',
    },
  ],
};

// ─────────────────────────────────────────
// Community Service
// ─────────────────────────────────────────
export const communityService = {
  getVolunteerOpportunities: async (): Promise<VolunteerOpportunity[]> => [
    {
      id: '1',
      title: 'Ramadan Iftar Preparation',
      description:
        'Help prepare and serve iftar meals for the community every Friday during Ramadan.',
      eventDate: '2026-03-15',
      spotsTotal: 20,
      spotsFilled: 8,
      status: 'open',
    },
    {
      id: '2',
      title: 'Youth Quran Competition Volunteers',
      description:
        'Help organize and run our annual youth Quran memorization competition.',
      eventDate: '2026-04-05',
      spotsTotal: 15,
      spotsFilled: 12,
      status: 'open',
    },
    {
      id: '3',
      title: 'Masjid Cleaning Crew',
      description:
        'Monthly deep cleaning of the masjid prayer hall and facilities. Every first Saturday.',
      eventDate: '2026-03-07',
      spotsTotal: 10,
      spotsFilled: 4,
      status: 'open',
    },
  ],

  getProposals: async () => [],
};

// ─────────────────────────────────────────
// School Service
// ─────────────────────────────────────────
export const schoolService = {
  getStudents: async () => [],
  getAssignments: async () => [],
};
