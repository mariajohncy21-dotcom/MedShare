import { User, MedicalSource, Medicine, InventoryItem, EmergencyRequest, Reservation, DirectPharmacyRequest, AuditLogItem, NotificationItem } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    // Graceful log for offline / async operations
    console.warn(`[MedShare API] Request to ${endpoint} failed:`, err.message || err);
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      return request<User>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    register: async (userData: any) => {
      return request<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
  },

  // Health & Database Status
  health: {
    check: async () => {
      return request<{ status: string; database: string; timestamp: string }>('/health');
    },
  },

  // Medical Sources / Facilities
  sources: {
    getAll: async () => {
      return request<MedicalSource[]>('/sources');
    },
  },

  // Medicines
  medicines: {
    getAll: async () => {
      return request<Medicine[]>('/medicines');
    },
    search: async (query?: string, category?: string) => {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('category', category);
      return request<Medicine[]>(`/medicines/search?${params.toString()}`);
    },
    getById: async (id: string) => {
      return request<Medicine>(`/medicines/${id}`);
    },
  },

  // Inventory
  inventory: {
    getAll: async () => {
      return request<InventoryItem[]>('/inventory');
    },
    getBySource: async (sourceId: string) => {
      return request<InventoryItem[]>(`/inventory/source/${sourceId}`);
    },
    updateStock: async (payload: {
      sourceId: string;
      medicineId: string;
      medicineName: string;
      dosage?: string;
      unitPrice?: number;
      quantity: number;
      batchNumber?: string;
      expiryDate?: string;
    }) => {
      return request<InventoryItem>('/inventory/update', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          pricePerUnit: payload.unitPrice,
        }),
      });
    },
    deleteStock: async (id: string) => {
      return request<{ success: boolean; deletedId: string }>(`/inventory/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Emergency & Direct Requests
  emergency: {
    getAll: async () => {
      return request<EmergencyRequest[]>('/emergency/requests');
    },
    create: async (req: Partial<EmergencyRequest>) => {
      return request<EmergencyRequest>('/emergency/requests', {
        method: 'POST',
        body: JSON.stringify(req),
      });
    },
    updateStatus: async (id: string, status: string) => {
      return request<EmergencyRequest>(`/emergency/requests/${id}/status?status=${encodeURIComponent(status)}`, {
        method: 'PATCH',
      });
    },
    getDirectRequests: async (pharmacyId?: string) => {
      const query = pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
      return request<DirectPharmacyRequest[]>(`/emergency/direct-requests${query}`);
    },
    createDirectRequest: async (directReq: Partial<DirectPharmacyRequest>) => {
      return request<DirectPharmacyRequest>('/emergency/direct-requests', {
        method: 'POST',
        body: JSON.stringify(directReq),
      });
    },
    respondDirectRequest: async (
      id: string,
      status: 'ACCEPTED' | 'REJECTED' | 'PARTIALLY_ACCEPTED',
      fulfilledQuantity?: number,
      notes?: string
    ) => {
      const params = new URLSearchParams({ status });
      if (fulfilledQuantity !== undefined) params.append('fulfilledQuantity', String(fulfilledQuantity));
      if (notes) params.append('notes', notes);
      return request<DirectPharmacyRequest>(`/emergency/direct-requests/${id}/respond?${params.toString()}`, {
        method: 'PATCH',
      });
    },
  },

  // Reservations
  reservations: {
    getAll: async (userId?: string) => {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      return request<Reservation[]>(`/reservations${query}`);
    },
    create: async (reservation: Partial<Reservation>) => {
      return request<Reservation>('/reservations', {
        method: 'POST',
        body: JSON.stringify(reservation),
      });
    },
    updateStatus: async (id: string, status: string) => {
      return request<Reservation>(`/reservations/${id}/status?status=${encodeURIComponent(status)}`, {
        method: 'PATCH',
      });
    },
  },

  // Admin & Verification
  admin: {
    getVerificationQueue: async (status?: string) => {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      return request<MedicalSource[]>(`/admin/verification-queue${query}`);
    },
    verifySource: async (id: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
      const params = new URLSearchParams({ status });
      if (notes) params.append('notes', notes);
      return request<MedicalSource>(`/admin/sources/${id}/verify?${params.toString()}`, {
        method: 'PATCH',
      });
    },
    suspendSource: async (id: string, suspend: boolean, reason?: string) => {
      const params = new URLSearchParams({ suspend: String(suspend) });
      if (reason) params.append('reason', reason);
      return request<MedicalSource>(`/admin/sources/${id}/suspend?${params.toString()}`, {
        method: 'PATCH',
      });
    },
    updateSource: async (id: string, updates: Partial<MedicalSource>) => {
      return request<MedicalSource>(`/admin/sources/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    deleteSource: async (id: string, reason?: string) => {
      const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      return request<MedicalSource>(`/admin/sources/${id}${query}`, {
        method: 'DELETE',
      });
    },
    getAuditLogs: async () => {
      return request<AuditLogItem[]>('/admin/audit-logs');
    },
    getNetworkStats: async () => {
      return request<any>('/admin/network-stats');
    },
  },

  // Notifications
  notifications: {
    getAll: async (userId?: string, role?: string) => {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (role) params.append('role', role);
      return request<any[]>(`/notifications?${params.toString()}`);
    },
    create: async (notification: Partial<NotificationItem>) => {
      return request<any>('/notifications', {
        method: 'POST',
        body: JSON.stringify(notification),
      });
    },
    markRead: async (id: string) => {
      return request<any>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },
  },
};

export default api;
