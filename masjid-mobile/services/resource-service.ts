import api from './api-client';

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

interface ResourceCollection {
  resources: Resource[];
  categories: ResourceCategory[];
  page: number;
  total: number;
  hasMore: boolean;
}

class ResourceService {
  async list(filters?: {
    category?: string;
    type?: ResourceType;
    search?: string;
    featured?: boolean;
    page?: number;
  }): Promise<ResourceCollection> {
    const response = await api.instance.get<ResourceCollection>('/resources', { params: filters });
    return response.data;
  }

  async getCategories(): Promise<ResourceCategory[]> {
    return (await this.list()).categories;
  }

  async getResources(filters?: {
    category?: string;
    type?: ResourceType;
    gradeLevel?: string;
    search?: string;
  }): Promise<Resource[]> {
    const response = await this.list({
      category: filters?.category,
      type: filters?.type,
      search: filters?.search,
    });
    return filters?.gradeLevel
      ? response.resources.filter(r => r.gradeLevels.includes(filters.gradeLevel!))
      : response.resources;
  }

  async getFeaturedResources(): Promise<Resource[]> {
    return (await this.list({ featured: true })).resources;
  }

  async getResource(resourceId: string): Promise<Resource> {
    const response = await api.instance.get<Resource>(`/resources/${encodeURIComponent(resourceId)}`);
    return response.data;
  }

  async recordView(resourceId: string): Promise<void> {
    await api.instance.post(`/resources/${encodeURIComponent(resourceId)}/view`);
  }

  async getRelatedResources(resourceId: string): Promise<Resource[]> {
    const resource = await this.getResource(resourceId);
    const matches = await this.getResources({ category: resource.category });
    return matches.filter(candidate => candidate.id !== resourceId).slice(0, 8);
  }

  // Downloadable materials are stored as HTTPS links; React Native's Linking or
  // a native sharing library should open them, not an unauthenticated proxy.
  async getDownloadUrl(resourceId: string): Promise<string> {
    const resource = await this.getResource(resourceId);
    return resource.url;
  }

  async getResourcesByClass(_classId: string): Promise<Resource[]> {
    // Class-specific publishing is not yet part of the database schema.
    return [];
  }

  async searchResources(query: string): Promise<Resource[]> {
    return (await this.list({ search: query })).resources;
  }
}

export default new ResourceService();
