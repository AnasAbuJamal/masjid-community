import api from './api-client';
export interface StudentAttendance {
  student: { id: string; firstName: string; lastName: string; class: { name: string } } | null;
  records: { id: string; date: string; status: 'present' | 'absent' | 'late' | 'excused'; class: { name: string } }[];
  summary: { present: number; absent: number; late: number; excused: number; total: number } | null;
  page: number;
  totalPages: number;
}
export async function getStudentAttendance(page = 1): Promise<StudentAttendance> {
  const response = await api.instance.get<StudentAttendance>('/students/me/attendance', { params: { page } });
  return response.data;
}
