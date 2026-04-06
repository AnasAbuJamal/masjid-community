import axios from 'axios';

const API_BASE = 'https://api.masjidalmomineen.com';

export interface Volunteer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  availability: string[];
  totalHours: number;
  assignments: number;
  rating: number;
  status: 'active' | 'inactive';
}

export interface VolunteerShift {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  requiredVolunteers: number;
  signedUp: number;
  status: 'open' | 'filled' | 'completed' | 'cancelled';
  volunteers: string[];
}

export interface VolunteerHours {
  volunteerId: string;
  volunteerName: string;
  hours: number;
  date: string;
  activity: string;
  approved: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  memberCount: number;
  activeProjects: number;
}

export interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
}

class VolunteerCrmService {
  async getVolunteers(): Promise<Volunteer[]> {
    const response = await axios.get(`${API_BASE}/volunteers`);
    return response.data;
  }

  async getVolunteer(volunteerId: string): Promise<Volunteer> {
    const response = await axios.get(`${API_BASE}/volunteers/${volunteerId}`);
    return response.data;
  }

  async getShifts(date?: string): Promise<VolunteerShift[]> {
    const params = date ? `?date=${date}` : '';
    const response = await axios.get(`${API_BASE}/volunteer-shifts${params}`);
    return response.data;
  }

  async signUpForShift(shiftId: string, volunteerId: string): Promise<VolunteerShift> {
    const response = await axios.post(`${API_BASE}/volunteer-shifts/${shiftId}/signup`, { volunteerId });
    return response.data;
  }

  async cancelShiftSignup(shiftId: string, volunteerId: string): Promise<void> {
    await axios.delete(`${API_BASE}/volunteer-shifts/${shiftId}/signup/${volunteerId}`);
  }

  async getTeams(): Promise<Team[]> {
    const response = await axios.get(`${API_BASE}/volunteer-teams`);
    return response.data;
  }

  async getVolunteerHours(volunteerId?: string): Promise<VolunteerHours[]> {
    const params = volunteerId ? `?volunteerId=${volunteerId}` : '';
    const response = await axios.get(`${API_BASE}/volunteer-hours${params}`);
    return response.data;
  }

  async logHours(data: { volunteerId: string; hours: number; date: string; activity: string }): Promise<VolunteerHours> {
    const response = await axios.post(`${API_BASE}/volunteer-hours`, data);
    return response.data;
  }

  async approveHours(hoursId: string): Promise<VolunteerHours> {
    const response = await axios.post(`${API_BASE}/volunteer-hours/${hoursId}/approve`);
    return response.data;
  }

  async getTasks(assignedTo?: string): Promise<VolunteerTask[]> {
    const params = assignedTo ? `?assignedTo=${assignedTo}` : '';
    const response = await axios.get(`${API_BASE}/volunteer-tasks${params}`);
    return response.data;
  }

  async createTask(data: Omit<VolunteerTask, 'id'>): Promise<VolunteerTask> {
    const response = await axios.post(`${API_BASE}/volunteer-tasks`, data);
    return response.data;
  }

  async updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<VolunteerTask> {
    const response = await axios.patch(`${API_BASE}/volunteer-tasks/${taskId}`, { status });
    return response.data;
  }

  async getVolunteerStats(): Promise<{ totalVolunteers: number; activeShifts: number; hoursThisMonth: number; topVolunteers: Volunteer[] }> {
    const response = await axios.get(`${API_BASE}/volunteer-stats`);
    return response.data;
  }
}

export const volunteerCrmService = new VolunteerCrmService();
export default volunteerCrmService;
