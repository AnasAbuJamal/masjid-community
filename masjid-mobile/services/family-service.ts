import api from './api-client';
export interface FamilyStudent {
 id: string;
 firstName: string;
 lastName: string;
 class: { name: string; teacherName: string; schedule: string };
 attendances: { id: string; date: string; status: 'present' | 'absent' | 'late' | 'excused'; class: { name: string } }[];
 reports: { id: string; title: string; content: string; category: string; createdAt: string }[];
}
export async function getMyFamily(): Promise<FamilyStudent[]> {
 const response = await api.instance.get<{ children: FamilyStudent[] }>('/parents/me/children');
 return response.data.children;
}
