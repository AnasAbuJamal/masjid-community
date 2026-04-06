import axios from 'axios';

const API_BASE = 'https://api.masjidalmomineen.com';

export type ResourceType = 'video' | 'document' | 'link' | 'audio' | 'image';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize?: number;
  tags: string[];
  gradeLevels: string[];
  createdAt: string;
  createdBy: string;
  viewCount: number;
  isFeatured: boolean;
}

export interface ResourceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  resourceCount: number;
}

class ResourceService {
  async getCategories(): Promise<ResourceCategory[]> {
    const response = await axios.get(`${API_BASE}/resources/categories`);
    return response.data;
  }

  async getResources(filters?: {
    category?: string;
    type?: ResourceType;
    gradeLevel?: string;
    search?: string;
  }): Promise<Resource[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await axios.get(`${API_BASE}/resources?${params}`);
    return response.data;
  }

  async getFeaturedResources(): Promise<Resource[]> {
    const response = await axios.get(`${API_BASE}/resources/featured`);
    return response.data;
  }

  async getResource(resourceId: string): Promise<Resource> {
    const response = await axios.get(`${API_BASE}/resources/${resourceId}`);
    return response.data;
  }

  async recordView(resourceId: string): Promise<void> {
    await axios.post(`${API_BASE}/resources/${resourceId}/view`);
  }

  async getRelatedResources(resourceId: string): Promise<Resource[]> {
    const response = await axios.get(`${API_BASE}/resources/${resourceId}/related`);
    return response.data;
  }

  async downloadResource(resourceId: string): Promise<Blob> {
    const response = await axios.get(`${API_BASE}/resources/${resourceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getResourcesByClass(classId: string): Promise<Resource[]> {
    const response = await axios.get(`${API_BASE}/classes/${classId}/resources`);
    return response.data;
  }

  async searchResources(query: string): Promise<Resource[]> {
    const response = await axios.get(`${API_BASE}/resources/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
}

export default new ResourceService();
