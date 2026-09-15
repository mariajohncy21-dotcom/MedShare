import { User, MedicalSource, Medicine, InventoryItem, EmergencyRequest, Reservation, DirectPharmacyRequest, AuditLogItem, NotificationItem, HospitalPatient } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

// ─── Token helpers ──────────────────────────────────────────────────────────
function getToken(): string {
  return localStorage.getItem('medshare_token') || '';
}

export function setToken(token: string) {
  localStorage.setItem('medshare_token', token);
}

export function clearToken() {
  localStorage.removeItem('medshare_token');
}

// ─── Core request utility ───────────────────────────────────────────────────
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      clearToken();
      // Let caller handle redirect; throw generic auth error
      throw new Error('401: Authentication required. Please log in.');
    }
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`403: ${body.error || 'Access denied.'}`);
    }
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`[MedShare API] Request to ${endpoint} failed:`, err.message || err);
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      return request<User & { token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    register: async (userData: any) => {
      return request<User & { token?: string }>('/auth/register', {
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
        body: JSON.stringify({ ...payload, pricePerUnit: payload.unitPrice }),
      });
    },
    deleteStock: async (id: string) => {
      return request<{ success: boolean; deletedId: string }>(`/inventory/${id}`, {
        method: 'DELETE',
      });
    },
    // Bulk upload — preview (validate only, no DB write)
    bulkPreview: async (rows: any[]) => {
      return request<{
        totalRows: number; validRows: number; invalidRows: number;
        valid: any[]; invalid: any[];
      }>('/inventory/bulk-upload/preview', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
    },
    // Bulk upload — commit (write validated rows to DB)
    bulkCommit: async (rows: any[]) => {
      return request<{ committed: number; items: any[] }>('/inventory/bulk-upload/commit', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
    },
  },

  // Hospital Patients (Hospital-scoped)
  hospitalPatients: {
    getAll: async (hospitalId?: string) => {
      const q = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : '';
      return request<HospitalPatient[]>(`/hospital-patients${q}`);
    },
    getById: async (id: string) => {
      return request<HospitalPatient>(`/hospital-patients/${id}`);
    },
    create: async (patient: Partial<HospitalPatient>) => {
      return request<HospitalPatient>('/hospital-patients', {
        method: 'POST',
        body: JSON.stringify(patient),
      });
    },
    update: async (id: string, updates: Partial<HospitalPatient>) => {
      return request<HospitalPatient>(`/hospital-patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    delete: async (id: string) => {
      return request<{ success: boolean }>(`/hospital-patients/${id}`, {
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
    getAllSources: async () => {
      return request<MedicalSource[]>('/sources');
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

  // MedShare AI Chat (secure backend proxy - key never in frontend)
  ai: {
    chat: async (message: string, conversationId?: string) => {
      return request<{ reply: string; role: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      });
    },
  },

  // Mobile OTP Verification
  otp: {
    sendOtp: async (phone: string, email?: string) => {
      return request<{ success: boolean; message: string; devOtp?: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, email }),
      });
    },
    verifyOtp: async (phone: string, otp: string) => {
      return request<{ success: boolean; message: string }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });
    },
  },

  // Daily Operational Reports (11 AM Deadline)
  dailyReports: {
    getHospitalReports: async (hospitalId?: string) => {
      const q = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : '';
      return request<any[]>(`/daily-reports/hospital${q}`);
    },
    submitHospitalReport: async (reportData: any) => {
      return request<any>('/daily-reports/hospital', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
    },
    getPharmacyReports: async (pharmacyId?: string) => {
      const q = pharmacyId ? `?pharmacyId=${encodeURIComponent(pharmacyId)}` : '';
      return request<any[]>(`/daily-reports/pharmacy${q}`);
    },
    submitPharmacyReport: async (reportData: any) => {
      return request<any>('/daily-reports/pharmacy', {
        method: 'POST',
        body: JSON.stringify(reportData),
      });
    },
    getAdminSummary: async () => {
      return request<{
        hospitals: { total: number; submitted: number; pending: number; overdue: number; reports: any[] };
        pharmacies: { total: number; submitted: number; pending: number; overdue: number; reports: any[] };
      }>('/daily-reports/admin');
    },
  },

  // Patient Recent Medicine Search History
  searchHistory: {
    get: async () => {
      return request<string[]>('/search-history');
    },
    add: async (query: string) => {
      return request<{ success: boolean }>('/search-history', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
    },
    clear: async () => {
      return request<{ success: boolean }>('/search-history', {
        method: 'DELETE',
      });
    },
  },
};

export default api;
