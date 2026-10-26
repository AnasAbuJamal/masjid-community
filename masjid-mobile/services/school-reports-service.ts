import api from './api-client';
export type ReportCategory = 'general' | 'academic' | 'behavioral' | 'daily';
export interface ReportStudent { id: number; studentId: number; firstName: string; lastName: string }
export interface SchoolReport { id: number; title: string; content: string; category: ReportCategory; createdAt: string; updatedAt: string; teacher: { firstName: string; lastName: string } | null }
export async function getReportStudents(classId: number, page: number): Promise<{ students: ReportStudent[]; page: number; totalPages: number }> {
  const response = await api.instance.get('/classroom/students', { params: { classId, page, limit: 50 } });
  return response.data;
}
export async function getSchoolReports(studentId: number, page = 1): Promise<{ reports: SchoolReport[]; page: number; hasMore: boolean }> {
  const response = await api.instance.get('/student-reports', { params: { studentId, page, limit: 20 } });
  return response.data;
}
export async function updateSchoolReport(id: number, input: { title: string; content: string; category: ReportCategory; expectedUpdatedAt: string }): Promise<void> {
  await api.instance.put(`/student-reports/${id}`, input);
}
export async function createSchoolReport(input: { studentId: number; title: string; content: string; category: ReportCategory }): Promise<SchoolReport> {
  const response = await api.instance.post<{ report: SchoolReport }>('/student-reports', input);
  return response.data.report;
}
