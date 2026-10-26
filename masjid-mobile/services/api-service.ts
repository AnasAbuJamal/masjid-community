import api, { api as apiClient } from './api-client';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'staff' | 'member' | 'student';
  phone?: string;
  avatar?: string;
  createdAt?: string;
  isVerified?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  verificationEmailSent?: boolean;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah1: string;
  jummah2: string;
  date: string;
  hijri?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'ramadan' | 'urgent' | 'event';
  image?: string;
  date: string;
  createdAt: string;
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
  postedAt: string;
}

export interface VolunteerOpportunity {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  spotsTotal: number;
  spotsFilled: number;
  status: 'open' | 'closed' | 'cancelled';
}

export interface Donation {
  id: string;
  amount: number;
  category: 'sadaqah' | 'zakat' | 'fitra' | ' Ramadan' | 'building' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: string;
  receiptUrl?: string | null;
  isRecurring?: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  author: string;
  status: 'pending' | 'under_review' | 'needs_revision' | 'approved' | 'in_progress' | 'completed' | 'declined' | 'on_hold' | 'open' | 'rejected';
  votes: number;
  createdAt: string;
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  attendance: number;
}

export interface StudentDetail {
  id: number;
  studentId: number;
  firstName: string;
  lastName: string;
  class: { id: number; name: string; teacherName: string; schedule: string | null };
  totalPoints: number;
  currentLevel: number;
  attendanceRate: number;
  attendance: {
    rate: number;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    recentRecords: { date: string; status: string; className: string }[];
  };
  recentAssignments: {
    id: number;
    date: string;
    type: string;
    description: string;
    status: string;
    rating: string;
  }[];
  reports: StudentReport[];
}

export interface StudentReport {
  id: number;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  teacher?: { firstName: string; lastName: string };
}

export interface StudentApplication {
  id: string;
  studentName: string;
  dateOfBirth: string;
  gradeLevel: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  programName: string;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  coverImage?: string;
  tags: string[];
  author?: { firstName: string; lastName: string };
  createdAt: string;
  updatedAt?: string;
  isFeatured?: boolean;
}

export interface ConstructionProject {
  id: string;
  title: string;
  description?: string;
  progressPercent: number;
  isUrgent: boolean;
}

export interface GamificationStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  totalPoints: number;
  currentLevel: number;
  attendanceRate: number;
}

export interface FinancialSummary {
  totalSpent: number;
  bankBalance: number;
  totalGoal: number;
  totalRaised: number;
  remainingNeeded: number;
}

export interface FinancialRecord {
  id: string;
  month: string;
  year: number;
  donations: number;
  expenses: number;
  notes?: string;
}

export interface WorkerProfile {
  id: string;
  fullName: string;
  headline: string;
  bio: string;
  skills: string[];
  location: string;
  availability: 'available' | 'open_to_offers' | 'not_available';
  photoUrl?: string;
  status: string;
  phone?: string;
  email?: string;
  experience?: { title: string; company: string; duration: string }[];
  education?: { degree: string; institution: string; year: string }[];
  certifications?: string[];
  portfolioUrl?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'submitted' | 'reviewed' | 'shortlisted' | 'hired' | 'declined';
  appliedAt: string;
  coverLetter?: string;
}

export interface VolunteerApplication {
  id: string;
  opportunityId: string;
  title: string;
  eventDate: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
}

export interface MyApplications {
  jobs: JobApplication[];
  volunteers: VolunteerApplication[];
}

export interface RentalItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  priceHourly: number | null;
  priceDaily: number | null;
}

export interface RentalBooking {
  id: string;
  itemId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  eventName: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  adminNotes: string | null;
  createdAt: string;
  item: { name: string; category: string };
}

// API Service
export const apiService = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      try {
        const response = await api.instance.post<AuthResponse>('/auth/login', { email, password });
        await apiClient.setToken(response.data.token);
        return response.data;
      } catch (error: unknown) {
        throw error;
      }
    },

    register: async (data: { email: string; password: string; firstName: string; lastName: string }): Promise<AuthResponse> => {
      const response = await api.instance.post<AuthResponse>('/auth/register', data);
      await apiClient.setToken(response.data.token);
      return response.data;
    },

    logout: async (): Promise<void> => {
      await apiClient.clearToken();
    },

    requestVerification: async (): Promise<void> => {
      await api.instance.post("/auth/verification/request");
    },

    me: async (): Promise<User> => {
      const response = await api.instance.get<User>('/auth/me');
      return response.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
      const response = await api.instance.patch<User>('/auth/profile', data);
      return response.data;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
      await api.instance.post('/auth/change-password', { currentPassword, newPassword });
    },
  },

  // Prayer Times
  prayers: {
    getToday: async (): Promise<PrayerTimes> => {
      try {
        const response = await api.instance.get<PrayerTimes>('/prayers/today');
        return response.data;
      } catch {
        return { fajr: '--:--', sunrise: '--:--', dhuhr: '--:--', asr: '--:--', maghrib: '--:--', isha: '--:--', jummah1: '', jummah2: '', date: new Date().toISOString().slice(0, 10) };
      }
    },

    getWeek: async (): Promise<PrayerTimes[]> => {
      try {
        const response = await api.instance.get<PrayerTimes[]>('/prayers/week');
        return response.data;
      } catch {
        return [];
      }
    },

    getMonth: async (month: number, year: number): Promise<PrayerTimes[]> => {
      try {
        const response = await api.instance.get<PrayerTimes[]>(`/prayers/${year}/${month}`);
        return response.data;
      } catch {
        return [];
      }
    },
  },

  // Announcements
  announcements: {
    getAll: async (): Promise<Announcement[]> => {
      try {
        const response = await api.instance.get<{ announcements: Announcement[] }>('/public/announcements');
        return response.data.announcements || [];
      } catch {
        return [];
      }
    },

    getById: async (id: string): Promise<Announcement | null> => {
      try {
        const response = await api.instance.get<Announcement>(`/announcements/${id}`);
        return response.data;
      } catch {
        return null;
      }
    },
  },

  // Jobs
  jobs: {
    getAll: async (): Promise<Job[]> => {
      try {
        const response = await api.instance.get<{ jobs: Job[] }>('/public/jobs');
        return (response.data.jobs || []).map(j => ({ ...j, id: String(j.id), status: 'active' as const }));
      } catch {
        return [];
      }
    },

    getById: async (id: string): Promise<Job | null> => {
      try {
        const response = await api.instance.get<Job>(`/public/jobs/${encodeURIComponent(id)}`);
        return response.data;
      } catch {
        return null;
      }
    },

    apply: async (jobId: string, data: { coverLetter: string }): Promise<void> => {
      await api.instance.post(`/jobs/${jobId}/apply`, data);
    },
  },

  // Volunteers
  volunteers: {
    getOpportunities: async (): Promise<VolunteerOpportunity[]> => {
      try {
        const response = await api.instance.get<{ opportunities: VolunteerOpportunity[] }>('/public/volunteers');
        return response.data.opportunities || [];
      } catch {
        return [];
      }
    },

    signUp: async (opportunityId: string, data: { userName: string; userEmail: string; userPhone?: string }): Promise<void> => {
      await api.instance.post('/public/volunteers', { opportunityId, ...data });
    },

    getMyOpportunities: async (): Promise<VolunteerOpportunity[]> => {
      const response = await api.instance.get<{ opportunities: VolunteerOpportunity[] }>('/public/volunteers');
      return response.data.opportunities || [];
    },
  },

  // Donations
  donations: {
    getRecurring: async (): Promise<{
      donations: { id: string; category: string; amount: number; frequency: 'weekly' | 'monthly';
        nextDate: string; active: boolean; status: string }[];
    }> => {
      const response = await api.instance.get('/donations/recurring');
      return response.data;
    },
    cancelRecurring: async (subscriptionId: string): Promise<void> => {
      await api.instance.patch('/donations/recurring', { subscriptionId, action: 'cancel' });
    },
    createCheckout: async (data: {
      amount: number;
      campaign: string;
      isAnonymous: boolean;
      isRecurring: boolean;
      recurringFrequency?: 'weekly' | 'monthly';
      donorName?: string;
    }): Promise<{ sessionId: string; url: string }> => {
      const response = await api.instance.post<{ sessionId: string; url: string }>('/donations/checkout', data);
      if (!response.data.url || !response.data.url.startsWith('https://checkout.stripe.com/')) {
        throw new Error('Secure checkout is unavailable');
      }
      return response.data;
    },
    getHistory: async (): Promise<Donation[]> => {
      try {
        const response = await api.instance.get<Donation[]>('/donations/mine');
        return response.data;
      } catch {
        return [];
      }
    },

    createPaymentIntent: async (amount: number, category: string): Promise<{ clientSecret: string }> => {
      const response = await api.instance.post<{ clientSecret: string }>('/donations/create-payment', { amount, category });
      return response.data;
    },

    recordDonation: async (data: { amount: number; category: string; stripePaymentId: string }): Promise<Donation> => {
      const response = await api.instance.post<Donation>('/donations', data);
      return response.data;
    },

    getCampaigns: async () => {
      const response = await api.instance.get('/donations/campaigns');
      return response.data;
    },
  },

  // Proposals
  proposals: {
    getAll: async (): Promise<Proposal[]> => {
      try {
        const response = await api.instance.get<{ proposals: Proposal[] }>('/public/proposals');
        return response.data.proposals || [];
      } catch {
        return [];
      }
    },

    vote: async (proposalId: string): Promise<void> => {
      await api.instance.post(`/public/proposals/${proposalId}/vote`);
    },

    create: async (data: { title: string; description: string; category?: string }): Promise<Proposal> => {
      const response = await api.instance.post<Proposal>('/public/proposals', data);
      return response.data;
    },
  },

  // School
  school: {
    getStudents: async (): Promise<Student[]> => {
      try {
        const response = await api.instance.get<Student[]>('/school/students');
        return response.data;
      } catch {
        return [];
      }
    },

    getAssignments: async (): Promise<Assignment[]> => {
      try {
        const response = await api.instance.get<Assignment[]>('/school/assignments');
        return response.data;
      } catch {
        return [];
      }
    },

    getAttendance: async (studentId: string): Promise<{ date: string; present: boolean }[]> => {
      const response = await api.instance.get(`/school/attendance/${studentId}`);
      return response.data;
    },

    submitApplication: async (data: {
      studentName: string;
      dateOfBirth: string;
      gradeLevel: string;
      parentName: string;
      parentEmail: string;
      parentPhone: string;
      programName: string;
      notes?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      emergencyRelation?: string;
      parentPreferredContact?: string;
    }): Promise<StudentApplication> => {
      const response = await api.instance.post<StudentApplication>('/public/students', data);
      return response.data;
    },

    getMyApplications: async (): Promise<StudentApplication[]> => {
      try {
        const response = await api.instance.get<StudentApplication[]>('/public/students');
        return response.data;
      } catch {
        return [];
      }
    },

    lookupByStudentId: async (studentId: string): Promise<StudentDetail | null> => {
      const response = await api.instance.get<StudentDetail>(`/public/students/${studentId}`);
      return response.data;
    },

    getReports: async (studentId?: number): Promise<StudentReport[]> => {
      try {
        const url = studentId ? `/student-reports?studentId=${studentId}` : '/student-reports';
        const response = await api.instance.get<{ reports: StudentReport[] }>(url);
        return response.data.reports || [];
      } catch {
        return [];
      }
    },

    createReport: async (data: { studentId: number; title: string; content: string; category?: string }): Promise<boolean> => {
      try {
        await api.instance.post('/student-reports', data);
        return true;
      } catch {
        return false;
      }
    },
  },

  // Rentals
  rentals: {
    getAll: async (): Promise<RentalItem[]> => {
      try {
        const response = await api.instance.get<RentalItem[]>('/public/rentals');
        return response.data;
      } catch {
        return [];
      }
    },

    book: async (data: {
      itemId: string;
      renterName: string;
      renterEmail: string;
      renterPhone: string;
      eventName?: string;
      startDate: string;
      endDate: string;
      priceType: 'hourly' | 'daily';
    }): Promise<RentalBooking> => {
      const response = await api.instance.post<RentalBooking>('/public/rentals/book', data);
      return response.data;
    },

    getMyBookings: async (): Promise<RentalBooking[]> => {
      try {
        const response = await api.instance.get<RentalBooking[]>('/public/rentals/bookings');
        return response.data;
      } catch {
        return [];
      }
    },
  },

  // Notifications
  notifications: {
    registerDevice: async (token: string): Promise<void> => {
      await api.instance.post('/notifications/register', { token });
    },

    getAll: async () => {
      const response = await api.instance.get('/notifications');
      return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
      await api.instance.patch(`/notifications/${id}/read`);
    },
  },

  // Blog / News
  blog: {
    getAll: async (): Promise<BlogPost[]> => {
      try {
        const response = await api.instance.get<{ posts: BlogPost[] }>('/public/blog');
        return response.data.posts || [];
      } catch {
        return [];
      }
    },

    getBySlug: async (slug: string): Promise<BlogPost | null> => {
      try {
        const response = await api.instance.get<{ post: BlogPost }>(`/public/blog?slug=${slug}`);
        return response.data.post;
      } catch {
        return null;
      }
    },
  },

  // Construction Projects
  construction: {
    getAll: async (): Promise<ConstructionProject[]> => {
      try {
        const response = await api.instance.get<{ projects: ConstructionProject[] }>('/public/construction');
        return response.data.projects || [];
      } catch {
        return [];
      }
    },
  },

  // Gamification / Leaderboard
  gamification: {
    getLeaderboard: async (): Promise<GamificationStudent[]> => {
      try {
        const response = await api.instance.get<{ students: GamificationStudent[] }>('/public/gamification');
        return response.data.students || [];
      } catch {
        return [];
      }
    },
  },

  // Finances
  finances: {
    getSummary: async (): Promise<FinancialSummary> => {
      try {
        const response = await api.instance.get<{ summary: FinancialSummary }>('/public/finances');
        return response.data.summary || { totalSpent: 0, bankBalance: 0, totalGoal: 0, totalRaised: 0, remainingNeeded: 0 };
      } catch {
        return { totalSpent: 0, bankBalance: 0, totalGoal: 0, totalRaised: 0, remainingNeeded: 0 };
      }
    },

    getRecords: async (): Promise<FinancialRecord[]> => {
      try {
        const response = await api.instance.get<{ records: FinancialRecord[] }>('/public/finances');
        return response.data.records || [];
      } catch {
        return [];
      }
    },
  },

  // Workers
  workers: {
    getAll: async (): Promise<WorkerProfile[]> => {
      try {
        const response = await api.instance.get<{ workers: WorkerProfile[] }>('/public/workers');
        return response.data.workers || [];
      } catch {
        return [];
      }
    },

    getById: async (id: string): Promise<WorkerProfile | null> => {
      try {
        const response = await api.instance.get<WorkerProfile>(`/public/workers/${id}`);
        return response.data;
      } catch {
        return null;
      }
    },
  },

  // Applications (Jobs + Volunteers)
  applications: {
    getMyApplications: async (): Promise<MyApplications> => {
      try {
        const response = await api.instance.get<MyApplications>('/applications/mine');
        return response.data;
      } catch {
        return { jobs: [], volunteers: [] };
      }
    },

    submitJobApplication: async (jobId: string, data: { coverLetter: string; resumeUrl?: string }): Promise<void> => {
      await api.instance.post(`/applications/jobs/${jobId}`, data);
    },

    submitVolunteerApplication: async (opportunityId: string, data: { skills?: string; notes?: string }): Promise<void> => {
      await api.instance.post(`/applications/volunteers/${opportunityId}`, data);
    },
  },
};

export default apiService;
