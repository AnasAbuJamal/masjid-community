import axios from 'axios';

const API_BASE = 'https://api.masjidalmomineen.com';

export interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalDonated: number;
  donationCount: number;
  lastDonationDate: string;
  donorLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  pledges: Pledge[];
  recurringDonations: RecurringDonation[];
}

export interface Pledge {
  id: string;
  campaignName: string;
  amount: number;
  pledgeDate: string;
  fulfillmentDate?: string;
  status: 'active' | 'fulfilled' | 'cancelled';
}

export interface RecurringDonation {
  id: string;
  campaignName: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly';
  startDate: string;
  nextDate: string;
  active: boolean;
}

export interface DonationCampaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  raised: number;
  startDate: string;
  endDate?: string;
  active: boolean;
}

export interface FinancialReport {
  revenue: number;
  expenses: number;
  netIncome: number;
  donationsByCategory: Record<string, number>;
  monthlyTrends: MonthlyTrend[];
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
}

export interface EventAttendance {
  eventId: string;
  eventName: string;
  date: string;
  registered: number;
  attended: number;
  rate: number;
}

export interface MemberGrowth {
  month: string;
  newMembers: number;
  activeMembers: number;
  totalMembers: number;
}

class CrmService {
  async getDonors(): Promise<Donor[]> {
    const response = await axios.get(`${API_BASE}/crm/donors`);
    return response.data;
  }

  async getDonor(donorId: string): Promise<Donor> {
    const response = await axios.get(`${API_BASE}/crm/donors/${donorId}`);
    return response.data;
  }

  async getDonationCampaigns(): Promise<DonationCampaign[]> {
    const response = await axios.get(`${API_BASE}/crm/campaigns`);
    return response.data;
  }

  async createPledge(data: { donorId: string; campaignName: string; amount: number; pledgeDate: string }): Promise<Pledge> {
    const response = await axios.post(`${API_BASE}/crm/pledges`, data);
    return response.data;
  }

  async fulfillPledge(pledgeId: string): Promise<Pledge> {
    const response = await axios.post(`${API_BASE}/crm/pledges/${pledgeId}/fulfill`);
    return response.data;
  }

  async getFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await axios.get(`${API_BASE}/crm/reports/financial?${params}`);
    return response.data;
  }

  async getEventAttendanceStats(eventId?: string): Promise<EventAttendance[]> {
    const params = eventId ? `?eventId=${eventId}` : '';
    const response = await axios.get(`${API_BASE}/crm/reports/attendance${params}`);
    return response.data;
  }

  async getMemberGrowthMetrics(): Promise<MemberGrowth[]> {
    const response = await axios.get(`${API_BASE}/crm/reports/member-growth`);
    return response.data;
  }

  async getDonorRecognitionLevels(): Promise<{ level: string; min: number; max: number; benefits: string[] }[]> {
    const response = await axios.get(`${API_BASE}/crm/donor-levels`);
    return response.data;
  }
}

export const crmService = new CrmService();
export default crmService;
