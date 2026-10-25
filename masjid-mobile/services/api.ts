import apiService from './api-service';
/**
 * API Service Layer
 * Connected to the staff-web backend API.
 * Base URL is configured via EXPO_PUBLIC_API_URL env variable.
 */

import api from './api-client';

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
  type: 'general' | 'ramadan' | 'urgent' | 'event' | 'fundraiser';
  date?: string;
  isActive?: boolean;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  salaryMin?: number;
  salaryMax?: number;
  status: 'active' | 'closed' | 'pending_review' | 'paused' | 'expired' | 'rejected';
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
  status: 'open' | 'closed';
}

// ─────────────────────────────────────────
// Prayer Service
// ─────────────────────────────────────────
export const prayerService = {
  getToday: async (): Promise<PrayerTimes> => {
    const times = await apiService.prayers.getToday();
    return times;
  },
  getWeek: async (): Promise<PrayerTimes[]> => apiService.prayers.getWeek(),
};

// ─────────────────────────────────────────
// Announcement Service
// ─────────────────────────────────────────
export const announcementService = {
  getAll: async (): Promise<Announcement[]> => {
    try {
      const res = await api.instance.get('/public/announcements');
      return (res.data.announcements || [])
        .filter((a: any) => a.isActive)
        .map((a: any) => ({
          id: String(a.id),
          title: a.title,
          message: a.message,
          type: a.type,
          date: a.startsAt ? new Date(a.startsAt).toLocaleDateString() : undefined,
          isActive: a.isActive,
        }));
    } catch (error) {
      console.error('[API] Failed to fetch announcements:', error);
      return [];
    }
  },

  getById: async (id: string): Promise<Announcement | null> => {
    const all = await announcementService.getAll();
    return all.find((a) => a.id === id) ?? null;
  },
};

// ─────────────────────────────────────────
// Job Service
// ─────────────────────────────────────────
export const jobService = {
  getAll: async (): Promise<Job[]> => {
    try {
      const res = await api.instance.get('/public/jobs');
      return (res.data.jobs || []).map((j: any) => ({
        id: String(j.id),
        title: j.title,
        company: j.company,
        description: j.description,
        location: j.location,
        employmentType: j.employmentType,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        status: j.status,
        isUrgent: j.isUrgent,
        contactEmail: j.contactEmail,
        postedAt: j.createdAt,
      }));
    } catch (error) {
      console.error('[API] Failed to fetch jobs:', error);
      return [];
    }
  },
};

// ─────────────────────────────────────────
// Community Service
// ─────────────────────────────────────────
export const communityService = {
  getVolunteerOpportunities: async (): Promise<VolunteerOpportunity[]> => {
    try {
      const res = await api.instance.get('/public/volunteers');
      return (res.data.opportunities || []).map((v: any) => ({
        id: String(v.id),
        title: v.title,
        description: v.description,
        eventDate: v.eventDate,
        spotsTotal: v.spotsTotal,
        spotsFilled: v.spotsFilled,
        status: v.status,
      }));
    } catch (error) {
      console.error('[API] Failed to fetch volunteer opportunities:', error);
      return [];
    }
  },

  getProposals: async () => {
    try {
      const res = await api.instance.get('/proposals');
      return res.data.proposals || [];
    } catch (error) {
      console.error('[API] Failed to fetch proposals:', error);
      return [];
    }
  },
};

// ─────────────────────────────────────────
// School Service
// ─────────────────────────────────────────
export const schoolService = {
  getStudents: async () => {
    try {
      const res = await api.instance.get('/classroom/students');
      return res.data.students || [];
    } catch (error) {
      console.error('[API] Failed to fetch students:', error);
      return [];
    }
  },

  getAssignments: async () => {
    try {
      const res = await api.instance.get('/assignments');
      return res.data.assignments || [];
    } catch (error) {
      console.error('[API] Failed to fetch assignments:', error);
      return [];
    }
  },
};
