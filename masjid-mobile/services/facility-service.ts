import axios from 'axios';

const API_BASE = 'https://api.masjidalmomineen.com';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  amenities: string[];
  hourlyRate: number;
  dailyRate: number;
  imageUrl?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  condition: 'excellent' | 'good' | 'fair' | 'needs_repair';
  location: string;
}

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  requesterName: string;
  requesterEmail: string;
  eventName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  totalPrice: number;
  notes?: string;
  equipment?: string[];
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

class FacilityService {
  async getRooms(): Promise<Room[]> {
    const response = await axios.get(`${API_BASE}/facilities/rooms`);
    return response.data;
  }

  async getRoom(roomId: string): Promise<Room> {
    const response = await axios.get(`${API_BASE}/facilities/rooms/${roomId}`);
    return response.data;
  }

  async getEquipment(): Promise<Equipment[]> {
    const response = await axios.get(`${API_BASE}/facilities/equipment`);
    return response.data;
  }

  async getBookings(roomId?: string, startDate?: string, endDate?: string): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (roomId) params.append('roomId', roomId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await axios.get(`${API_BASE}/facilities/bookings?${params}`);
    return response.data;
  }

  async createBooking(data: Omit<Booking, 'id' | 'status'>): Promise<Booking> {
    const response = await axios.post(`${API_BASE}/facilities/bookings`, data);
    return response.data;
  }

  async updateBookingStatus(bookingId: string, status: Booking['status']): Promise<Booking> {
    const response = await axios.patch(`${API_BASE}/facilities/bookings/${bookingId}`, { status });
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await axios.delete(`${API_BASE}/facilities/bookings/${bookingId}`);
  }

  async getAvailability(roomId: string, date: string): Promise<TimeSlot[]> {
    const response = await axios.get(`${API_BASE}/facilities/rooms/${roomId}/availability?date=${date}`);
    return response.data;
  }

  async checkConflicts(roomId: string, startDate: string, endDate: string): Promise<Booking[]> {
    const response = await axios.get(
      `${API_BASE}/facilities/rooms/${roomId}/conflicts?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data;
  }

  async createInvoice(bookingId: string): Promise<{ id: string; amount: number; pdfUrl: string }> {
    const response = await axios.post(`${API_BASE}/facilities/bookings/${bookingId}/invoice`);
    return response.data;
  }

  async getFacilityStats(): Promise<{
    totalRooms: number;
    totalEquipment: number;
    bookingsThisMonth: number;
    revenueThisMonth: number;
    utilizationRate: number;
  }> {
    const response = await axios.get(`${API_BASE}/facilities/stats`);
    return response.data;
  }
}

export const facilityService = new FacilityService();
export default facilityService;
