import api from './api-client';
export interface CommunityEvent {
  id: string; title: string; description: string; date: string; time: string;
  location: string; category: string; organizer: string; attendees: number; isRegistered: boolean;
}
export const eventService = {
  async getAll(): Promise<CommunityEvent[]> {
    const { data } = await api.instance.get<{ events: CommunityEvent[] }>('/public/events');
    return data.events;
  },
  async getById(id: string): Promise<CommunityEvent | null> {
    const { data } = await api.instance.get<{ events: CommunityEvent[] }>('/public/events', { params: { id } });
    return data.events[0] || null;
  },
  async register(eventId: string): Promise<void> {
    await api.instance.post('/public/events', { eventId });
  },
};
