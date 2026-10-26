import api from './api-client';
export type AttendanceMark = 'present' | 'absent' | 'late' | 'excused';
export interface TeachingClass { id: number; name: string; schedule: string; students: { id: number; firstName: string; lastName: string; studentId: number; isActive: boolean }[] }
export async function getTeachingClasses(page: number): Promise<{ classes: TeachingClass[]; page: number; totalPages: number; total: number }> {
  const response = await api.instance.get('/classroom/classes', { params: { page, limit: 20 } });
  return response.data;
}
export async function getClassAttendance(classId: number, date: string): Promise<{ class: TeachingClass | null; records: { studentId: number; status: AttendanceMark }[]; total: number }> {
  const response = await api.instance.get('/classroom/attendance', { params: { classId, date, limit: 500 } });
  return response.data;
}
export async function saveClassAttendance(classId: number, date: string, records: { studentId: number; status: AttendanceMark }[]): Promise<void> {
  await api.instance.post('/classroom/attendance', { classId, date, records });
}
