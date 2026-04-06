import axios from 'axios';

const API_BASE = 'https://api.masjidalmomineen.com';

export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  enrolledClasses: string[];
  profileImage?: string;
}

export interface ChildAttendance {
  date: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  className?: string;
}

export interface ChildGrade {
  assignmentTitle: string;
  className: string;
  points: number;
  maxPoints: number;
  percentage: number;
  feedback: string;
  dueDate: string;
}

export interface Payment {
  id: string;
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  paidDate?: string;
}

export interface ReportCard {
  id: string;
  term: string;
  year: number;
  overallGrade: string;
  gpa: number;
  classes: {
    name: string;
    grade: string;
    percentage: number;
    teacher: string;
  }[];
  issuedDate: string;
}

class ParentService {
  async getMyChildren(parentId: string): Promise<Child[]> {
    const response = await axios.get(`${API_BASE}/parents/${parentId}/children`);
    return response.data;
  }

  async getChildAttendance(childId: string, startDate?: string, endDate?: string): Promise<ChildAttendance[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await axios.get(`${API_BASE}/students/${childId}/attendance?${params}`);
    return response.data;
  }

  async getChildGrades(childId: string): Promise<ChildGrade[]> {
    const response = await axios.get(`${API_BASE}/students/${childId}/grades`);
    return response.data;
  }

  async getChildClasses(childId: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE}/students/${childId}/classes`);
    return response.data;
  }

  async getChildProgress(childId: string): Promise<any> {
    const response = await axios.get(`${API_BASE}/students/${childId}/progress`);
    return response.data;
  }

  async getChildPayments(childId: string): Promise<Payment[]> {
    const response = await axios.get(`${API_BASE}/students/${childId}/payments`);
    return response.data;
  }

  async makePayment(paymentId: string, paymentMethod: string): Promise<any> {
    const response = await axios.post(`${API_BASE}/payments/${paymentId}/pay`, { paymentMethod });
    return response.data;
  }

  async getReportCards(childId: string): Promise<ReportCard[]> {
    const response = await axios.get(`${API_BASE}/students/${childId}/report-cards`);
    return response.data;
  }

  async getReportCard(childId: string, reportCardId: string): Promise<ReportCard> {
    const response = await axios.get(`${API_BASE}/students/${childId}/report-cards/${reportCardId}`);
    return response.data;
  }

  async contactTeacher(data: {
    teacherId: string;
    parentId: string;
    studentId: string;
    subject: string;
    message: string;
  }): Promise<void> {
    await axios.post(`${API_BASE}/messages`, data);
  }

  async getAnnouncements(childId: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE}/students/${childId}/announcements`);
    return response.data;
  }
}

export default new ParentService();
