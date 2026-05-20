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
}

export interface AuthResponse {
  user: User;
  token: string;
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
  status: 'pending' | 'completed' | 'failed';
  date: string;
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
      console.log('[API] Calling login endpoint for:', email);
      try {
        const response = await api.instance.post<AuthResponse>('/auth/login', { email, password });
        console.log('[API] Login response status:', response.status);
        console.log('[API] Login response data:', response.data);
        await apiClient.setToken(response.data.token);
        return response.data;
      } catch (error: unknown) {
        console.log('[API] Login request failed:', error);
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number; data?: unknown } };
          console.log('[API] HTTP status:', axiosError.response?.status);
          console.log('[API] Response data:', axiosError.response?.data);
        }
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
        return getMockPrayerTimes();
      }
    },

    getWeek: async (): Promise<PrayerTimes[]> => {
      try {
        const response = await api.instance.get<PrayerTimes[]>('/prayers/week');
        return response.data;
      } catch {
        return getMockWeekPrayers();
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
        return getMockAnnouncements();
      }
    },

    getById: async (id: string): Promise<Announcement | null> => {
      try {
        const response = await api.instance.get<Announcement>(`/announcements/${id}`);
        return response.data;
      } catch {
        return getMockAnnouncements().find(a => a.id === id) || null;
      }
    },
  },

  // Jobs
  jobs: {
    getAll: async (): Promise<Job[]> => {
      try {
        const response = await api.instance.get<Job[]>('/jobs');
        return response.data;
      } catch {
        return getMockJobs();
      }
    },

    getById: async (id: string): Promise<Job | null> => {
      try {
        const response = await api.instance.get<Job>(`/jobs/${id}`);
        return response.data;
      } catch {
        return getMockJobs().find(j => j.id === id) || null;
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
        return getMockVolunteers();
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
    getHistory: async (): Promise<Donation[]> => {
      try {
        const response = await api.instance.get<Donation[]>('/donations');
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
        return getMockBlogPosts();
      }
    },

    getBySlug: async (slug: string): Promise<BlogPost | null> => {
      try {
        const response = await api.instance.get<{ post: BlogPost }>(`/public/blog?slug=${slug}`);
        return response.data.post;
      } catch {
        return getMockBlogPosts().find(p => p.slug === slug) || null;
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
        return getMockConstructionProjects();
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
        return getMockLeaderboard();
      }
    },
  },

  // Finances
  finances: {
    getSummary: async (): Promise<FinancialSummary> => {
      try {
        const response = await api.instance.get<{ summary: FinancialSummary }>('/public/finances');
        return response.data.summary || getMockFinancialSummary();
      } catch {
        return getMockFinancialSummary();
      }
    },

    getRecords: async (): Promise<FinancialRecord[]> => {
      try {
        const response = await api.instance.get<{ records: FinancialRecord[] }>('/public/finances');
        return response.data.records || [];
      } catch {
        return getMockFinancialRecords();
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
        return getMockWorkers();
      }
    },

    getById: async (id: string): Promise<WorkerProfile | null> => {
      try {
        const response = await api.instance.get<WorkerProfile>(`/public/workers/${id}`);
        return response.data;
      } catch {
        return getMockWorkers().find(w => w.id === id) || null;
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
        return getMockMyApplications();
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

// Mock Data Helpers
function getMockPrayerTimes(): PrayerTimes {
  return {
    fajr: '05:45',
    sunrise: '07:10',
    dhuhr: '12:30',
    asr: '15:45',
    maghrib: '18:00',
    isha: '19:30',
    jummah1: '13:00',
    jummah2: '14:00',
    date: new Date().toISOString().split('T')[0],
  };
}

function getMockWeekPrayers(): PrayerTimes[] {
  return Array.from({ length: 7 }, (_, i) => ({
    ...getMockPrayerTimes(),
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
  }));
}

function getMockAnnouncements(): Announcement[] {
  return [
    { id: '1', title: 'Ramadan Mubarak!', message: 'Wishing our entire community a blessed and joyful Ramadan.', type: 'ramadan', date: '2026-03-01', createdAt: '2026-03-01T00:00:00Z' },
    { id: '2', title: 'Youth Summer Registration Open', message: 'Registration is now open for summer Islamic school programs.', type: 'general', date: '2026-02-20', createdAt: '2026-02-20T00:00:00Z' },
    { id: '3', title: 'Masjid Expansion Fundraiser', message: 'We are launching Phase 2 of our expansion project.', type: 'event', date: '2026-02-15', createdAt: '2026-02-15T00:00:00Z' },
  ];
}

function getMockJobs(): Job[] {
  return [
    { id: '1', title: 'Part-Time Electrician', company: 'Al-Noor Electric', description: 'Looking for a licensed electrician.', location: 'Atlanta, GA', employmentType: 'part_time', salaryMin: 25, salaryMax: 40, status: 'active', isUrgent: true, contactEmail: 'careers@alnoor.com', postedAt: '2026-02-20' },
    { id: '2', title: 'Halal Catering Manager', company: 'Barakah Catering', description: 'Experienced catering manager needed.', location: 'Marietta, GA', employmentType: 'full_time', salaryMin: 45000, salaryMax: 60000, status: 'active', contactEmail: 'jobs@barakahcatering.com', postedAt: '2026-02-18' },
    { id: '3', title: 'Arabic Teacher', company: 'Masjid Al-Momineen School', description: 'Seeking Arabic language teacher.', location: 'Atlanta GA', employmentType: 'part_time', salaryMin: 20, salaryMax: 30, status: 'active', contactEmail: 'school@almomineen.org', postedAt: '2026-02-15' },
  ];
}

function getMockVolunteers(): VolunteerOpportunity[] {
  return [
    { id: '1', title: 'Ramadan Iftar Preparation', description: 'Help prepare iftar meals.', eventDate: '2026-03-15', spotsTotal: 20, spotsFilled: 8, status: 'open' },
    { id: '2', title: 'Youth Quran Competition', description: 'Help organize annual competition.', eventDate: '2026-04-05', spotsTotal: 15, spotsFilled: 12, status: 'open' },
    { id: '3', title: 'Masjid Cleaning Crew', description: 'Monthly deep cleaning.', eventDate: '2026-03-07', spotsTotal: 10, spotsFilled: 4, status: 'open' },
  ];
}

function getMockBlogPosts(): BlogPost[] {
  return [
    { id: '1', title: 'Ramadan Mubarak!', slug: 'ramadan-mubarak-2026', body: 'We wish our entire community a blessed and joyful Ramadan. Let us use this month to increase our worship, strengthen our community bonds, and seek the mercy of Allah SWT.\n\nThis year, we have planned many activities including daily Taraweeh prayers, Iftar meals for our brothers and sisters fasting, and special Qiyam-ul-Layl sessions during the last ten nights.\n\nMay Allah accept our fasting and prayers. Ameen.', coverImage: undefined, tags: ['Ramadan', 'Community'], author: { firstName: 'Admin', lastName: 'Team' }, createdAt: '2026-02-28T00:00:00Z' },
    { id: '2', title: 'Youth Summer Registration Now Open', slug: 'youth-summer-registration', body: 'Registration for our summer Islamic school programs is now officially open! We offer programs for ages 4-17 including Quran recitation, Arabic language, Islamic studies, and more.\n\nEarly bird discounts available until April 15th. Spots are limited so register early!', coverImage: undefined, tags: ['Education', 'Youth', 'Summer'], author: { firstName: 'School', lastName: 'Admin' }, createdAt: '2026-02-20T00:00:00Z' },
    { id: '3', title: 'Masjid Expansion Update: Phase 2 Progress', slug: 'expansion-phase-2-update', body: 'Alhamdulillah, we are thrilled to share that Phase 2 of our expansion project is now 65% complete. The new wing will include:\n\n- Expanded prayer hall (capacity: 500)\n- New Sunday school classrooms\n- Community hall\n- Kitchen facilities\n\nWe are grateful for every donation that has brought us this far. JazakAllahu khairan!', coverImage: undefined, tags: ['Construction', 'Community'], author: { firstName: 'Admin', lastName: 'Team' }, createdAt: '2026-02-15T00:00:00Z' },
    { id: '4', title: 'Annual Community Iftar - Save the Date!', slug: 'annual-community-iftar-2026', body: 'Mark your calendars! Our annual community Iftar will be held on March 20th, 2026 at the main prayer hall.\n\nThis beloved tradition brings together families from across our community for a beautiful evening of food, fellowship, and spirituality.\n\nVolunteers needed! Sign up at the community desk.', coverImage: undefined, tags: ['Event', 'Ramadan', 'Community'], author: { firstName: 'Events', lastName: 'Committee' }, createdAt: '2026-02-10T00:00:00Z' },
  ];
}

function getMockConstructionProjects(): ConstructionProject[] {
  return [
    { id: '1', title: 'New Prayer Hall Wing', description: 'Phase 2 expansion adding 300 additional prayer spaces with modern amenities.', progressPercent: 65, isUrgent: false },
    { id: '2', title: "Women's Lounge Renovation", description: "Complete renovation of the women's section including new wudu area and seating.", progressPercent: 40, isUrgent: false },
    { id: '3', title: 'Parking Lot Expansion', description: 'Adding 100 new parking spaces to accommodate growing attendance.', progressPercent: 90, isUrgent: false },
    { id: '4', title: 'Emergency Roof Repair', description: 'Critical repairs needed for sections of the roof damaged in recent storms.', progressPercent: 15, isUrgent: true },
    { id: '5', title: 'Solar Panel Installation', description: 'Environmentally friendly initiative to reduce energy costs by 60%.', progressPercent: 25, isUrgent: false },
  ];
}

function getMockLeaderboard(): GamificationStudent[] {
  return [
    { id: '1', firstName: 'Ahmad', lastName: 'Khan', studentId: 'STU001', totalPoints: 4850, currentLevel: 4, attendanceRate: 98 },
    { id: '2', firstName: 'Fatima', lastName: 'Ali', studentId: 'STU002', totalPoints: 4200, currentLevel: 3, attendanceRate: 95 },
    { id: '3', firstName: 'Yusuf', lastName: 'Hassan', studentId: 'STU003', totalPoints: 3750, currentLevel: 3, attendanceRate: 92 },
    { id: '4', firstName: 'Aisha', lastName: 'Mohammed', studentId: 'STU004', totalPoints: 3100, currentLevel: 2, attendanceRate: 97 },
    { id: '5', firstName: 'Omar', lastName: 'Ibrahim', studentId: 'STU005', totalPoints: 2800, currentLevel: 2, attendanceRate: 88 },
    { id: '6', firstName: 'Zainab', lastName: 'Omar', studentId: 'STU006', totalPoints: 2400, currentLevel: 2, attendanceRate: 94 },
    { id: '7', firstName: 'Hassan', lastName: 'Malik', studentId: 'STU007', totalPoints: 1900, currentLevel: 1, attendanceRate: 85 },
    { id: '8', firstName: 'Mariam', lastName: 'Hussein', studentId: 'STU008', totalPoints: 1500, currentLevel: 1, attendanceRate: 90 },
  ];
}

function getMockFinancialSummary(): FinancialSummary {
  return {
    totalSpent: 125000,
    bankBalance: 89000,
    totalGoal: 500000,
    totalRaised: 285000,
    remainingNeeded: 215000,
  };
}

function getMockFinancialRecords(): FinancialRecord[] {
  return [
    { id: '1', month: 'January', year: 2026, donations: 28500, expenses: 12400, notes: 'Normal monthly operations' },
    { id: '2', month: 'February', year: 2026, donations: 31200, expenses: 11800, notes: 'Increased Ramadan donations' },
    { id: '3', month: 'March', year: 2026, donations: 45000, expenses: 15600, notes: 'Ramadan month - high community support' },
  ];
}

function getMockWorkers(): WorkerProfile[] {
  return [
    { id: '1', fullName: 'Ahmed Al-Rashid', headline: 'Licensed Electrician', bio: 'Experienced electrician with 15+ years in residential and commercial electrical work. Certified and insured. Alhamdulillah, I have completed over 200 projects in the Atlanta area and have been serving our community for 8 years.', skills: ['Electrical', 'Solar Installation', 'Maintenance', 'Panel Upgrades', 'Wiring'], location: 'Atlanta, GA', availability: 'available', status: 'approved', phone: '+1-555-0101', email: 'ahmed@contractor.com', experience: [{ title: 'Senior Electrician', company: 'Al-Rashid Electrical', duration: '2018 - Present' }, { title: 'Electrician', company: 'PowerPro Services', duration: '2012 - 2018' }], education: [{ degree: 'Master Electrician License', institution: 'Georgia State Board', year: '2012' }], certifications: ['Licensed Master Electrician', 'OSHA 30 Certified', 'Solar PV Installer'], portfolioUrl: 'https://alrashidelectric.com' },
    { id: '2', fullName: 'Sarah Johnson', headline: 'Professional Cleaner', bio: 'Professional cleaning services specializing in mosques and religious facilities. Eco-friendly products used. I understand the unique needs of prayer spaces and can ensure the highest standards of cleanliness.', skills: ['Deep Cleaning', 'Sanitization', 'Event Setup', 'Carpet Care', 'Window Cleaning'], location: 'Atlanta, GA', availability: 'available', status: 'approved', phone: '+1-555-0102', email: 'sarah@cleanpro.com', experience: [{ title: 'Facility Manager', company: 'CleanPro Services', duration: '2019 - Present' }, { title: 'Cleaning Specialist', company: 'PureSpace Janitorial', duration: '2015 - 2019' }], education: [{ degree: 'Facility Management Certificate', institution: 'Georgia Tech', year: '2015' }], certifications: ['IICRC Certified', 'Eco-Friendly Products Specialist'] },
    { id: '3', fullName: 'Mohammed Khan', headline: 'HVAC Technician', bio: 'Certified HVAC technician for heating and cooling systems. Available for maintenance and repairs. Specialized in commercial HVAC systems for large buildings.', skills: ['HVAC', 'AC Repair', 'Heating Systems', 'Ventilation', 'Ductwork'], location: 'Marietta, GA', availability: 'open_to_offers', status: 'approved', phone: '+1-555-0103', email: 'mohammed@hvacpro.com', experience: [{ title: 'Lead HVAC Technician', company: 'CoolAir Solutions', duration: '2020 - Present' }, { title: 'HVAC Installer', company: 'TempControl Inc.', duration: '2016 - 2020' }], education: [{ degree: 'HVAC/R Certificate', institution: 'ITT Technical Institute', year: '2016' }], certifications: ['EPA 608 Universal', 'NATE Certified', 'Licensed HVAC Contractor'] },
    { id: '4', fullName: 'Yusuf Abdi', headline: 'General Contractor', bio: 'Licensed general contractor experienced in commercial and institutional construction projects. Quality workmanship with a commitment to completing projects on time and within budget.', skills: ['Construction', 'Renovation', 'Project Management', 'Masonry', 'Carpentry'], location: 'Atlanta, GA', availability: 'available', status: 'approved', phone: '+1-555-0104', email: 'yusuf@abdicontractors.com', experience: [{ title: 'Owner/Contractor', company: 'Abdi Contractors LLC', duration: '2015 - Present' }, { title: 'Project Supervisor', company: 'BuildRight Construction', duration: '2010 - 2015' }], education: [{ degree: 'BS Civil Engineering', institution: 'Georgia State University', year: '2010' }], certifications: ['Licensed General Contractor', 'OSHA 30', 'Lead-Safe Certified'] },
  ];
}

function getMockMyApplications(): MyApplications {
  return {
    jobs: [
      { id: '1', jobId: '1', jobTitle: 'Part-Time Electrician', company: 'Al-Noor Electric', status: 'reviewed', appliedAt: '2026-02-20' },
      { id: '2', jobId: '3', jobTitle: 'Arabic Teacher', company: 'Masjid Al-Momineen School', status: 'shortlisted', appliedAt: '2026-02-15' },
    ],
    volunteers: [
      { id: '3', opportunityId: '1', title: 'Ramadan Iftar Preparation', eventDate: '2026-03-15', status: 'approved', appliedAt: '2026-02-25' },
      { id: '4', opportunityId: '3', title: 'Masjid Cleaning Crew', eventDate: '2026-03-07', status: 'pending', appliedAt: '2026-03-01' },
    ],
  };
}

export default apiService;
