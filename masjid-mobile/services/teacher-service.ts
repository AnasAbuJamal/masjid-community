import axios from 'axios';

const API_BASE = 'https://api.masjidalmomineen.com';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  classes: string[];
}

export interface Assignment {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
}

export interface StudentGrade {
  studentId: string;
  studentName: string;
  assignmentId: string;
  points: number;
  feedback: string;
  submittedAt: string;
}

export interface ClassAttendance {
  id: string;
  classId: string;
  date: string;
  students: {
    studentId: string;
    studentName: string;
    status: 'present' | 'absent' | 'excused' | 'late';
  }[];
}

class TeacherService {
  async getTeacherProfile(teacherId: string): Promise<Teacher> {
    const response = await axios.get(`${API_BASE}/teachers/${teacherId}`);
    return response.data;
  }

  async getMyClasses(teacherId: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE}/teachers/${teacherId}/classes`);
    return response.data;
  }

  async getClassStudents(classId: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE}/classes/${classId}/students`);
    return response.data;
  }

  async getAssignments(classId: string): Promise<Assignment[]> {
    const response = await axios.get(`${API_BASE}/classes/${classId}/assignments`);
    return response.data;
  }

  async createAssignment(data: {
    classId: string;
    title: string;
    description: string;
    dueDate: string;
    maxPoints: number;
  }): Promise<Assignment> {
    const response = await axios.post(`${API_BASE}/assignments`, data);
    return response.data;
  }

  async updateAssignment(assignmentId: string, data: Partial<Assignment>): Promise<Assignment> {
    const response = await axios.patch(`${API_BASE}/assignments/${assignmentId}`, data);
    return response.data;
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    await axios.delete(`${API_BASE}/assignments/${assignmentId}`);
  }

  async getGrades(assignmentId: string): Promise<StudentGrade[]> {
    const response = await axios.get(`${API_BASE}/assignments/${assignmentId}/grades`);
    return response.data;
  }

  async submitGrade(data: {
    assignmentId: string;
    studentId: string;
    points: number;
    feedback: string;
  }): Promise<StudentGrade> {
    const response = await axios.post(`${API_BASE}/grades`, data);
    return response.data;
  }

  async getAttendance(classId: string, date: string): Promise<ClassAttendance> {
    const response = await axios.get(`${API_BASE}/classes/${classId}/attendance?date=${date}`);
    return response.data;
  }

  async markAttendance(data: {
    classId: string;
    date: string;
    students: { studentId: string; status: string }[];
  }): Promise<ClassAttendance> {
    const response = await axios.post(`${API_BASE}/attendance`, data);
    return response.data;
  }

  async getClassSchedule(teacherId: string): Promise<any[]> {
    const response = await axios.get(`${API_BASE}/teachers/${teacherId}/schedule`);
    return response.data;
  }

  async getStudentProgress(studentId: string): Promise<any> {
    const response = await axios.get(`${API_BASE}/students/${studentId}/progress`);
    return response.data;
  }
}

export default new TeacherService();
