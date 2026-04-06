import axios from 'axios';

const API_BASE = 'https://api.masjidalmomineen.com';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToName: string;
  createdBy: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface FollowUp {
  id: string;
  title: string;
  description: string;
  relatedTo: string;
  relatedType: 'task' | 'event' | 'donation' | 'booking' | 'volunteer';
  assignedTo: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  active: boolean;
}

export interface ApprovalRequest {
  id: string;
  type: 'booking' | 'expense' | 'purchase' | 'content' | 'other';
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  approverName?: string;
  createdAt: string;
  respondedAt?: string;
  comments: ApprovalComment[];
}

export interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
}

class TaskService {
  async getTasks(filters?: { status?: string; assignedTo?: string; priority?: string }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.priority) params.append('priority', filters.priority);
    const response = await axios.get(`${API_BASE}/tasks?${params}`);
    return response.data;
  }

  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'subtasks'>): Promise<Task> {
    const response = await axios.post(`${API_BASE}/tasks`, data);
    return response.data;
  }

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task> {
    const response = await axios.patch(`${API_BASE}/tasks/${taskId}`, data);
    return response.data;
  }

  async addSubtask(taskId: string, title: string): Promise<Subtask> {
    const response = await axios.post(`${API_BASE}/tasks/${taskId}/subtasks`, { title });
    return response.data;
  }

  async toggleSubtask(taskId: string, subtaskId: string): Promise<Subtask> {
    const response = await axios.patch(`${API_BASE}/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
    return response.data;
  }

  async getFollowUps(assignedTo?: string): Promise<FollowUp[]> {
    const params = assignedTo ? `?assignedTo=${assignedTo}` : '';
    const response = await axios.get(`${API_BASE}/followups${params}`);
    return response.data;
  }

  async createFollowUp(data: Omit<FollowUp, 'id' | 'completedAt'>): Promise<FollowUp> {
    const response = await axios.post(`${API_BASE}/followups`, data);
    return response.data;
  }

  async completeFollowUp(followUpId: string): Promise<FollowUp> {
    const response = await axios.post(`${API_BASE}/followups/${followUpId}/complete`);
    return response.data;
  }

  async getReminders(): Promise<Reminder[]> {
    const response = await axios.get(`${API_BASE}/reminders`);
    return response.data;
  }

  async createReminder(data: Omit<Reminder, 'id'>): Promise<Reminder> {
    const response = await axios.post(`${API_BASE}/reminders`, data);
    return response.data;
  }

  async toggleReminder(reminderId: string): Promise<Reminder> {
    const response = await axios.patch(`${API_BASE}/reminders/${reminderId}/toggle`);
    return response.data;
  }

  async getApprovalRequests(status?: string): Promise<ApprovalRequest[]> {
    const params = status ? `?status=${status}` : '';
    const response = await axios.get(`${API_BASE}/approvals${params}`);
    return response.data;
  }

  async createApprovalRequest(data: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt' | 'comments'>): Promise<ApprovalRequest> {
    const response = await axios.post(`${API_BASE}/approvals`, data);
    return response.data;
  }

  async respondToApproval(approvalId: string, action: 'approved' | 'rejected', comment?: string): Promise<ApprovalRequest> {
    const response = await axios.post(`${API_BASE}/approvals/${approvalId}/respond`, { action, comment });
    return response.data;
  }

  async addApprovalComment(approvalId: string, comment: string): Promise<ApprovalComment> {
    const response = await axios.post(`${API_BASE}/approvals/${approvalId}/comments`, { comment });
    return response.data;
  }

  async getTaskStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    myTasks: number;
  }> {
    const response = await axios.get(`${API_BASE}/tasks/stats`);
    return response.data;
  }
}

export const taskService = new TaskService();
export default taskService;
