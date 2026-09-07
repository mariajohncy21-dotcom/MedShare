import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Medicine,
  MedicalSource,
  InventoryItem,
  Reservation,
  EmergencyRequest,
  StockTransfer,
  NotificationItem,
  AllocationPlan,
  ReservationStatus,
  AuditLogItem,
  DirectPharmacyRequest,
  StockChangeLog,
} from '../types';
import {
  MOCK_USERS,
  MOCK_SOURCES,
  MOCK_MEDICINES,
  INITIAL_INVENTORY,
  INITIAL_RESERVATIONS,
  INITIAL_EMERGENCY_REQUESTS,
  INITIAL_DIRECT_REQUESTS,
  INITIAL_TRANSFERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  getExpiryStatus,
} from '../data/mockData';
import { api } from '../services/api';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (data: any) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateUserProfile: (updates: Partial<User>) => void;
  medicines: Medicine[];
  sources: MedicalSource[];
  inventory: InventoryItem[];
  reservations: Reservation[];
  emergencyRequests: EmergencyRequest[];
  directRequests: DirectPharmacyRequest[];
  transfers: StockTransfer[];
  auditLogs: AuditLogItem[];
  stockChangeLogs: StockChangeLog[];
  notifications: NotificationItem[];
  unreadCount: number;

  // Actions
  createReservation: (plan: AllocationPlan, patientInfo?: { name: string; phone: string }) => Reservation;
  updateReservationStatus: (reservationId: string, status: ReservationStatus, sourceId?: string) => void;
  cancelReservation: (reservationId: string, reason?: string) => void;
  createEmergencyRequest: (req: Omit<EmergencyRequest, 'id' | 'createdAt' | 'status' | 'matchedSourcesCount'>) => EmergencyRequest;
  updateEmergencyStatus: (id: string, status: EmergencyRequest['status']) => void;
  
  // Direct Hospital -> Pharmacy Emergency Requests
  sendDirectHospitalRequest: (req: Omit<DirectPharmacyRequest, 'id' | 'createdAt' | 'status'>) => DirectPharmacyRequest;
  respondToDirectHospitalRequest: (
    requestId: string,
    status: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED',
    acceptedQuantity?: number,
    rejectionReason?: string
  ) => void;

  // Inventory Management
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'updatedAt' | 'expiryStatus' | 'stockStatus' | 'latitude' | 'longitude'>) => void;
  updateInventoryQuantity: (id: string, newQuantity: number, reason?: string) => void;
  deleteInventoryItem: (id: string, reason?: string) => void;
  createStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'createdAt' | 'status'>) => StockTransfer;
  updateTransferStatus: (transferId: string, status: StockTransfer['status']) => void;

  // Organization Verifications & Admin Operations
  approveSource: (sourceId: string) => void;
  rejectSource: (sourceId: string, reason: string) => void;
  suspendSource: (sourceId: string, reason: string) => void;
  reactivateSource: (sourceId: string) => void;
  updateSource: (sourceId: string, updates: Partial<MedicalSource>) => void;
  softDeleteSource: (sourceId: string, reason?: string) => void;
  registerOrganization: (sourceData: Omit<MedicalSource, 'id' | 'verificationStatus' | 'accountStatus' | 'isVerified' | 'isDeleted' | 'rating'>) => MedicalSource;
  broadcastShortageAlert: (
    medicineName: string,
    shortageType: 'OUT_OF_STOCK' | 'CRITICAL_LOW',
    currentStock: number,
    threshold: number,
    targetRole?: 'ALL' | 'PHARMACY' | 'HOSPITAL',
    customMessage?: string
  ) => void;

  // Audit Logs & Notifications
  addAuditLog: (action: AuditLogItem['action'], orgName: string, orgType: AuditLogItem['organizationType'], reason: string, details?: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetToDemoData: () => void;

  // Live Database Connectivity
  dbStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  dbName: string;
  refreshFromDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial states or from localStorage
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('medshare_user_v2');
    return saved ? JSON.parse(saved) : MOCK_USERS.patient;
  });

  const [medicines, setMedicines] = useState<Medicine[]>(MOCK_MEDICINES);

  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('CONNECTING');
  const [dbName, setDbName] = useState<string>('medshare_db');

  const refreshFromDatabase = async () => {
    try {
      const health = await api.health.check().catch(() => null);
      if (health && health.status === 'UP') {
        setDbStatus('CONNECTED');
        setDbName('medshare_db');
      } else {
        setDbStatus('DISCONNECTED');
      }

      // Fetch live collections directly from MongoDB backend
      const [liveSources, liveInventory, liveMedicines, liveReservations, liveEmergency, liveDirectReqs, liveAuditLogs] = await Promise.allSettled([
        api.sources.getAll(),
        api.inventory.getAll(),
        api.medicines.getAll(),
        api.reservations.getAll(),
        api.emergency.getAll(),
        api.emergency.getDirectRequests(),
        api.admin.getAuditLogs(),
      ]);

      if (liveSources.status === 'fulfilled' && Array.isArray(liveSources.value) && liveSources.value.length > 0) {
        setSources(liveSources.value);
        localStorage.setItem('medshare_sources_v2', JSON.stringify(liveSources.value));
      }

      if (liveInventory.status === 'fulfilled' && Array.isArray(liveInventory.value) && liveInventory.value.length > 0) {
        setInventory(liveInventory.value);
        localStorage.setItem('medshare_inventory_v2', JSON.stringify(liveInventory.value));
      }

      if (liveMedicines.status === 'fulfilled' && Array.isArray(liveMedicines.value) && liveMedicines.value.length > 0) {
        setMedicines(liveMedicines.value);
      }

      if (liveReservations.status === 'fulfilled' && Array.isArray(liveReservations.value)) {
        setReservations(liveReservations.value);
        localStorage.setItem('medshare_reservations_v2', JSON.stringify(liveReservations.value));
      }

      if (liveEmergency.status === 'fulfilled' && Array.isArray(liveEmergency.value)) {
        setEmergencyRequests(liveEmergency.value);
        localStorage.setItem('medshare_emergency_requests_v2', JSON.stringify(liveEmergency.value));
      }

      if (liveDirectReqs.status === 'fulfilled' && Array.isArray(liveDirectReqs.value)) {
        setDirectRequests(liveDirectReqs.value);
        localStorage.setItem('medshare_direct_requests_v2', JSON.stringify(liveDirectReqs.value));
      }

      if (liveAuditLogs.status === 'fulfilled' && Array.isArray(liveAuditLogs.value)) {
        setAuditLogs(liveAuditLogs.value);
        localStorage.setItem('medshare_audit_logs_v2', JSON.stringify(liveAuditLogs.value));
      }
    } catch (err) {
      console.warn('Live MongoDB fetch warning:', err);
      setDbStatus('DISCONNECTED');
    }
  };

  useEffect(() => {
    refreshFromDatabase();
  }, []);

  const [sources, setSources] = useState<MedicalSource[]>(() => {
    const saved = localStorage.getItem('medshare_sources_v2');
    return saved ? JSON.parse(saved) : MOCK_SOURCES;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('medshare_inventory_v2');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('medshare_reservations_v2');
    return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
  });

  const [emergencyRequests, setEmergencyRequests] = useState<EmergencyRequest[]>(() => {
    const saved = localStorage.getItem('medshare_emergency_requests_v2');
    return saved ? JSON.parse(saved) : INITIAL_EMERGENCY_REQUESTS;
  });

  const [directRequests, setDirectRequests] = useState<DirectPharmacyRequest[]>(() => {
    const saved = localStorage.getItem('medshare_direct_requests_v2');
    return saved ? JSON.parse(saved) : INITIAL_DIRECT_REQUESTS;
  });

  const [transfers, setTransfers] = useState<StockTransfer[]>(() => {
    const saved = localStorage.getItem('medshare_transfers_v2');
    return saved ? JSON.parse(saved) : INITIAL_TRANSFERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('medshare_audit_logs_v2');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [stockChangeLogs, setStockChangeLogs] = useState<StockChangeLog[]>(() => {
    const saved = localStorage.getItem('medshare_stock_logs_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('medshare_notifications_v2');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('medshare_user_v2', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('medshare_sources_v2', JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    localStorage.setItem('medshare_inventory_v2', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('medshare_reservations_v2', JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem('medshare_emergency_requests_v2', JSON.stringify(emergencyRequests));
  }, [emergencyRequests]);

  useEffect(() => {
    localStorage.setItem('medshare_direct_requests_v2', JSON.stringify(directRequests));
  }, [directRequests]);

  useEffect(() => {
    localStorage.setItem('medshare_transfers_v2', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('medshare_audit_logs_v2', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('medshare_stock_logs_v2', JSON.stringify(stockChangeLogs));
  }, [stockChangeLogs]);

  useEffect(() => {
    localStorage.setItem('medshare_notifications_v2', JSON.stringify(notifications));
  }, [notifications]);

  // Hydrate from MongoDB on mount if available
  useEffect(() => {
    const fetchMongoData = async () => {
      try {
        const [mongoSources, mongoInventory, mongoReservations, mongoEmergency, mongoAudit] = await Promise.allSettled([
          api.admin.getVerificationQueue(),
          api.inventory.getAll(),
          api.reservations.getAll(),
          api.emergency.getAll(),
          api.admin.getAuditLogs(),
        ]);

        if (mongoSources.status === 'fulfilled' && mongoSources.value.length > 0) {
          setSources(mongoSources.value);
        }
        if (mongoInventory.status === 'fulfilled' && mongoInventory.value.length > 0) {
          setInventory(mongoInventory.value);
        }
        if (mongoReservations.status === 'fulfilled' && mongoReservations.value.length > 0) {
          setReservations(mongoReservations.value);
        }
        if (mongoEmergency.status === 'fulfilled' && mongoEmergency.value.length > 0) {
          setEmergencyRequests(mongoEmergency.value);
        }
        if (mongoAudit.status === 'fulfilled' && mongoAudit.value.length > 0) {
          setAuditLogs(mongoAudit.value);
        }
      } catch (err) {
        console.info('Backend initial sync deferred; operating in offline-first mode.');
      }
    };

    fetchMongoData();
  }, []);

  // Periodic check for expired reservations
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      setReservations((prev) =>
        prev.map((res) => {
          if (res.status === 'PENDING' || res.status === 'CONFIRMED') {
            const exp = new Date(res.expiresAt).getTime();
            if (now > exp) {
              return { ...res, status: 'EXPIRED' };
            }
          }
          return res;
        })
      );
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const addAuditLog = (
    action: AuditLogItem['action'],
    orgName: string,
    orgType: AuditLogItem['organizationType'] = 'SYSTEM',
    reason: string,
    details?: string
  ) => {
    const now = new Date();
    const newLog: AuditLogItem = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      action,
      organizationName: orgName,
      organizationType: orgType,
      performedBy: currentUser.name || 'System Operator',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reason,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const user = await api.auth.login({ email, password });
      setCurrentUser(user);
      localStorage.setItem('medshare_user_v2', JSON.stringify(user));
      return { success: true, user };
    } catch (err: any) {
      const errMsg = err.message?.includes('401')
        ? 'Invalid email or password. Please verify your credentials.'
        : err.message?.includes('403')
        ? 'This facility account has been decommissioned by the Administrator.'
        : err.message || 'Authentication failed. Please try again.';
      return { success: false, error: errMsg };
    }
  };

  const register = async (
    data: any
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const user = await api.auth.register(data);
      // Auto-login citizen patients
      if (user.role === 'PATIENT') {
        setCurrentUser(user);
        localStorage.setItem('medshare_user_v2', JSON.stringify(user));
      }
      return { success: true, user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = () => {
    const guestPatient = MOCK_USERS.patient;
    setCurrentUser(guestPatient);
    localStorage.removeItem('medshare_user_v2');
  };

  const switchRole = (role: UserRole) => {
    if (role === 'PATIENT') setCurrentUser(MOCK_USERS.patient);
    else if (role === 'PHARMACY') setCurrentUser(MOCK_USERS.pharmacy);
    else if (role === 'HOSPITAL') setCurrentUser(MOCK_USERS.hospital);
    else if (role === 'ADMIN') setCurrentUser(MOCK_USERS.admin);
  };

  const updateUserProfile = (updates: Partial<User>) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updates };
      // If updating org name/phone/address, sync with sources list
      if (prev.sourceId && (updates.name || updates.phone || updates.address)) {
        setSources((sPrev) =>
          sPrev.map((s) =>
            s.id === prev.sourceId
              ? {
                  ...s,
                  name: updates.name || s.name,
                  phone: updates.phone || s.phone,
                  address: updates.address || s.address,
                }
              : s
          )
        );
      }
      return updated;
    });
  };

  const createReservation = (plan: AllocationPlan, patientInfo?: { name: string; phone: string }): Reservation => {
    const resId = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes window

    const newReservation: Reservation = {
      id: resId,
      userId: currentUser.id,
      userName: patientInfo?.name || currentUser.name,
      userPhone: patientInfo?.phone || currentUser.phone || '+91 98765 43210',
      medicineId: plan.medicineId,
      medicineName: plan.medicineName,
      totalQuantity: plan.fulfilledQuantity,
      urgency: plan.urgency,
      status: 'CONFIRMED',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      qrToken: `MS-RES-${resId}-${Math.floor(10000 + Math.random() * 90000)}`,
      allocationBreakdown: plan.allocatedSources.map((s) => ({
        sourceId: s.sourceId,
        sourceName: s.sourceName,
        quantity: s.allocatedQuantity,
        address: s.address,
        phone: s.phone,
        sourceStatus: 'CONFIRMED',
      })),
    };

    setReservations((prev) => [newReservation, ...prev]);

    // Persist to MongoDB
    api.reservations.create(newReservation).catch((e) => console.debug('MongoDB reservation sync note:', e));

    // Add Audit Log
    addAuditLog(
      'RESERVATION_CREATED',
      newReservation.allocationBreakdown[0]?.sourceName || 'MedShare Network',
      'PATIENT',
      `Hold created for ${newReservation.totalQuantity} units of ${newReservation.medicineName} by ${newReservation.userName}.`
    );

    // Send notifications to stakeholders
    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: `⚡ Reservation Confirmed: ${resId}`,
      message: `${newReservation.userName} reserved ${newReservation.totalQuantity} units of ${newReservation.medicineName}. 15-minute countdown active.`,
      type: 'RESERVATION',
      timestamp: 'Just now',
      read: false,
      link: '/reservations',
      targetRole: 'ALL',
    };
    setNotifications((prev) => [notif, ...prev]);

    return newReservation;
  };

  const updateReservationStatus = (reservationId: string, status: ReservationStatus, sourceId?: string) => {
    api.reservations.updateStatus(reservationId, status).catch((e) => console.debug('MongoDB updateStatus note:', e));
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id === reservationId) {
          if (sourceId) {
            const updatedBreakdown = res.allocationBreakdown.map((b) =>
              b.sourceId === sourceId ? { ...b, sourceStatus: (status === 'COLLECTED' ? 'COLLECTED' : b.sourceStatus) as any } : b
            );
            const allCollected = updatedBreakdown.every((b) => b.sourceStatus === 'COLLECTED');
            return {
              ...res,
              status: allCollected ? 'COLLECTED' : res.status,
              allocationBreakdown: updatedBreakdown,
            };
          }
          return { ...res, status };
        }
        return res;
      })
    );
  };

  const cancelReservation = (reservationId: string, reason = 'Patient cancelled reservation hold') => {
    api.reservations.updateStatus(reservationId, 'CANCELLED').catch((e) => console.debug('MongoDB cancel note:', e));
    setReservations((prev) =>
      prev.map((res) => {
        if (res.id === reservationId) {
          addAuditLog(
            'RESERVATION_CANCELLED',
            res.allocationBreakdown[0]?.sourceName || 'MedShare Network',
            'PATIENT',
            reason,
            `Reservation ${reservationId} of ${res.medicineName} cancelled and inventory released.`
          );
          return { ...res, status: 'CANCELLED' };
        }
        return res;
      })
    );
  };

  const createEmergencyRequest = (
    req: Omit<EmergencyRequest, 'id' | 'createdAt' | 'status' | 'matchedSourcesCount'>
  ): EmergencyRequest => {
    const emrId = `EMR-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEmergency: EmergencyRequest = {
      ...req,
      id: emrId,
      status: 'MATCHED',
      createdAt: new Date().toISOString(),
      matchedSourcesCount: 3,
    };

    setEmergencyRequests((prev) => [newEmergency, ...prev]);

    // Persist to MongoDB
    api.emergency.create(newEmergency).catch((e) => console.debug('MongoDB emergency sync note:', e));

    addAuditLog(
      'EMERGENCY_REQUEST_CREATED',
      req.location,
      'PATIENT',
      `Emergency broadcast for ${newEmergency.quantity} units of ${newEmergency.medicineName} (${newEmergency.urgency}).`
    );

    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: `🚨 EMERGENCY BROADCAST: ${emrId}`,
      message: `Critical alert for ${newEmergency.medicineName} (${newEmergency.quantity} units) requested by ${newEmergency.patientName}.`,
      type: 'EMERGENCY',
      timestamp: 'Just now',
      read: false,
      link: '/emergency',
      targetRole: 'ALL',
    };
    setNotifications((prev) => [notif, ...prev]);

    return newEmergency;
  };

  const updateEmergencyStatus = (id: string, status: EmergencyRequest['status']) => {
    api.emergency.updateStatus(id, status).catch((e) => console.debug('MongoDB emergency status note:', e));
    setEmergencyRequests((prev) =>
      prev.map((emr) => (emr.id === id ? { ...emr, status } : emr))
    );
  };

  const sendDirectHospitalRequest = (
    req: Omit<DirectPharmacyRequest, 'id' | 'createdAt' | 'status'>
  ): DirectPharmacyRequest => {
    const reqId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq: DirectPharmacyRequest = {
      ...req,
      id: reqId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    setDirectRequests((prev) => [newReq, ...prev]);

    // Persist to MongoDB
    api.emergency.createDirectRequest(newReq).catch((e) => console.debug('MongoDB direct request note:', e));

    addAuditLog(
      'EMERGENCY_REQUEST_CREATED',
      newReq.pharmacyName,
      'HOSPITAL',
      `Hospital ${newReq.hospitalName} requested ${newReq.requestedQuantity} units of ${newReq.medicineName}.`
    );

    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: `🚨 Emergency Direct Request: ${newReq.medicineName}`,
      message: `${newReq.hospitalName} requested ${newReq.requestedQuantity} units (${newReq.urgency}). Required by: ${newReq.requiredBy}.`,
      type: 'EMERGENCY',
      timestamp: 'Just now',
      read: false,
      link: '/pharmacy',
      targetRole: 'PHARMACY',
      targetSourceId: newReq.pharmacyId,
    };
    setNotifications((prev) => [notif, ...prev]);

    return newReq;
  };

  const respondToDirectHospitalRequest = (
    requestId: string,
    status: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED',
    acceptedQuantity?: number,
    rejectionReason?: string
  ) => {
    setDirectRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const updated: DirectPharmacyRequest = {
            ...req,
            status,
            acceptedQuantity: acceptedQuantity ?? (status === 'ACCEPTED' ? req.requestedQuantity : 0),
            rejectionReason,
            updatedAt: new Date().toISOString(),
          };

          const actionType =
            status === 'ACCEPTED'
              ? 'DIRECT_REQUEST_ACCEPTED'
              : status === 'PARTIALLY_ACCEPTED'
              ? 'DIRECT_REQUEST_PARTIALLY_ACCEPTED'
              : 'DIRECT_REQUEST_REJECTED';

          const reasonText =
            status === 'ACCEPTED'
              ? `Fully accepted ${req.requestedQuantity} units by ${req.pharmacyName}.`
              : status === 'PARTIALLY_ACCEPTED'
              ? `Partially accepted ${acceptedQuantity}/${req.requestedQuantity} units by ${req.pharmacyName}. Remainder auto-routed via Smart Allocation.`
              : `Rejected by ${req.pharmacyName}: ${rejectionReason || 'Stock depleted'}.`;

          addAuditLog(actionType, req.pharmacyName, 'PHARMACY', reasonText);

          // Persist response to MongoDB
          api.emergency.respondDirectRequest(requestId, status, acceptedQuantity, rejectionReason).catch((e) => console.debug('MongoDB direct respond note:', e));

          // Notify Hospital
          const notif: NotificationItem = {
            id: `NOTIF-${Date.now()}`,
            title: `📋 Hospital Request Update: ${req.medicineName}`,
            message: `${req.pharmacyName} ${status.toLowerCase().replace('_', ' ')} your request (${acceptedQuantity || 0}/${req.requestedQuantity} units).`,
            type: status === 'REJECTED' ? 'SHORTAGE' : 'EMERGENCY',
            timestamp: 'Just now',
            read: false,
            link: '/hospital',
            targetRole: 'HOSPITAL',
          };
          setNotifications((nPrev) => [notif, ...nPrev]);

          return updated;
        }
        return req;
      })
    );
  };

  const addInventoryItem = (
    item: Omit<InventoryItem, 'id' | 'updatedAt' | 'expiryStatus' | 'stockStatus' | 'latitude' | 'longitude'>
  ) => {
    const source = sources.find((s) => s.id === item.sourceId);
    const medicine = medicines.find((m) => m.id === item.medicineId);

    const expiryStatus = getExpiryStatus(item.expiryDate);
    const stockStatus =
      item.quantity === 0
        ? 'OUT_OF_STOCK'
        : medicine && item.quantity <= medicine.criticalThreshold
        ? 'CRITICAL'
        : medicine && item.quantity <= medicine.lowThreshold
        ? 'LOW'
        : 'GOOD';

    const newItem: InventoryItem = {
      ...item,
      id: `INV-${Date.now().toString().slice(-4)}`,
      updatedAt: new Date().toISOString(),
      expiryStatus,
      stockStatus,
      latitude: source?.latitude || 8.4184,
      longitude: source?.longitude || 77.8732,
      lastUpdatedBy: currentUser.name,
    };

    setInventory((prev) => [newItem, ...prev]);

    // Persist to MongoDB
    api.inventory.updateStock({
      sourceId: item.sourceId,
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      dosage: item.dosage,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
    }).catch((e) => console.debug('MongoDB inventory add note:', e));

    // Log Stock Change
    const log: StockChangeLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      inventoryId: newItem.id,
      medicineName: item.medicineName,
      sourceId: item.sourceId,
      sourceName: item.sourceName,
      previousQuantity: 0,
      newQuantity: item.quantity,
      updatedBy: currentUser.name,
      updatedAt: new Date().toISOString(),
      reason: `Initial stock line added for batch ${item.batchNumber}`,
    };
    setStockChangeLogs((prev) => [log, ...prev]);

    addAuditLog(
      'INVENTORY_UPDATED',
      item.sourceName,
      item.sourceType,
      `Added batch ${item.batchNumber} of ${item.medicineName} (${item.quantity} units).`
    );
  };

  const updateInventoryQuantity = (id: string, newQuantity: number, reason?: string) => {
    setInventory((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const medicine = medicines.find((m) => m.id === inv.medicineId);
          const stockStatus =
            newQuantity === 0
              ? 'OUT_OF_STOCK'
              : medicine && newQuantity <= medicine.criticalThreshold
              ? 'CRITICAL'
              : medicine && newQuantity <= medicine.lowThreshold
              ? 'LOW'
              : 'GOOD';

          const previousQty = inv.quantity;

          // Persist to MongoDB
          api.inventory.updateStock({
            sourceId: inv.sourceId,
            medicineId: inv.medicineId,
            medicineName: inv.medicineName,
            dosage: inv.dosage,
            unitPrice: inv.unitPrice,
            quantity: Math.max(0, newQuantity),
            batchNumber: inv.batchNumber,
            expiryDate: inv.expiryDate,
          }).catch((e) => console.debug('MongoDB inventory update note:', e));

          const log: StockChangeLog = {
            id: `LOG-${Date.now().toString().slice(-4)}`,
            inventoryId: inv.id,
            medicineName: inv.medicineName,
            sourceId: inv.sourceId,
            sourceName: inv.sourceName,
            previousQuantity: previousQty,
            newQuantity: Math.max(0, newQuantity),
            updatedBy: currentUser.name,
            updatedAt: new Date().toISOString(),
            reason: reason || `Manual stock update (${previousQty} -> ${newQuantity})`,
          };
          setStockChangeLogs((prevLogs) => [log, ...prevLogs]);

          addAuditLog(
            'INVENTORY_UPDATED',
            inv.sourceName,
            inv.sourceType,
            `Stock updated for ${inv.medicineName} (${inv.batchNumber}): ${previousQty} -> ${newQuantity} units. ${reason ? `[${reason}]` : ''}`
          );

          return {
            ...inv,
            quantity: Math.max(0, newQuantity),
            stockStatus,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: currentUser.name,
          };
        }
        return inv;
      })
    );
  };

  const deleteInventoryItem = (id: string, reason = 'Archived by facility operator') => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;

    api.inventory.deleteStock(id).catch((e) => console.debug('MongoDB delete stock note:', e));
    setInventory((prev) => prev.filter((i) => i.id !== id));

    addAuditLog(
      'INVENTORY_UPDATED',
      item.sourceName,
      item.sourceType,
      `Archived batch ${item.batchNumber} of ${item.medicineName}. Reason: ${reason}`
    );
  };

  const createStockTransfer = (transfer: Omit<StockTransfer, 'id' | 'createdAt' | 'status'>): StockTransfer => {
    const trfId = `TRF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTransfer: StockTransfer = {
      ...transfer,
      id: trfId,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    addAuditLog(
      'EMERGENCY_REQUEST_CREATED',
      newTransfer.fromSourceName,
      'HOSPITAL',
      `Inter-facility transfer authorized: ${newTransfer.quantity} units of ${newTransfer.medicineName} from ${newTransfer.fromSourceName} to ${newTransfer.toSourceName}.`
    );

    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: `🔄 Stock Transfer Authorized: ${trfId}`,
      message: `${newTransfer.quantity} units of ${newTransfer.medicineName} transferring from ${newTransfer.fromSourceName} to ${newTransfer.toSourceName}.`,
      type: 'TRANSFER',
      timestamp: 'Just now',
      read: false,
      link: '/hospital',
      targetRole: 'ALL',
    };
    setNotifications((prev) => [notif, ...prev]);

    return newTransfer;
  };

  const updateTransferStatus = (transferId: string, status: StockTransfer['status']) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? { ...t, status } : t))
    );
  };

  // Organization Verifications & Admin Operations
  const approveSource = (sourceId: string) => {
    api.admin.verifySource(sourceId, 'APPROVED').catch((e) => console.debug('MongoDB approve note:', e));
    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          addAuditLog(
            'ORGANIZATION_APPROVED',
            s.name,
            s.type,
            `Admin ${currentUser.name} verified organization license & assigned APPROVED status.`
          );

          const notif: NotificationItem = {
            id: `NOTIF-${Date.now()}`,
            title: `✓ Facility Approved: ${s.name}`,
            message: `${s.name} has been verified and granted active grid operational permissions.`,
            type: 'INFO',
            timestamp: 'Just now',
            read: false,
            link: '/admin',
            targetRole: 'ALL',
          };
          setNotifications((n) => [notif, ...n]);

          return {
            ...s,
            isVerified: true,
            verificationStatus: 'APPROVED',
            accountStatus: 'ACTIVE',
            verifiedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  };

  const rejectSource = (sourceId: string, reason: string) => {
    api.admin.verifySource(sourceId, 'REJECTED', reason).catch((e) => console.debug('MongoDB reject note:', e));
    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          addAuditLog(
            'ORGANIZATION_REJECTED',
            s.name,
            s.type,
            `Verification rejected by ${currentUser.name}. Reason: ${reason}`
          );

          return {
            ...s,
            isVerified: false,
            verificationStatus: 'REJECTED',
            accountStatus: 'PENDING',
            rejectionReason: reason,
          };
        }
        return s;
      })
    );
  };

  const suspendSource = (sourceId: string, reason: string) => {
    api.admin.suspendSource(sourceId, true, reason).catch((e) => console.debug('MongoDB suspend note:', e));
    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          addAuditLog(
            'ORGANIZATION_SUSPENDED',
            s.name,
            s.type,
            `Facility suspended by Admin: ${reason}`
          );

          return {
            ...s,
            isVerified: false,
            verificationStatus: 'SUSPENDED',
            accountStatus: 'SUSPENDED',
            suspensionReason: reason,
          };
        }
        return s;
      })
    );
  };

  const reactivateSource = (sourceId: string) => {
    api.admin.suspendSource(sourceId, false).catch((e) => console.debug('MongoDB reactivate note:', e));
    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          addAuditLog(
            'ORGANIZATION_REACTIVATED',
            s.name,
            s.type,
            `Admin restored facility accountStatus to ACTIVE.`
          );

          return {
            ...s,
            isVerified: true,
            verificationStatus: 'APPROVED',
            accountStatus: 'ACTIVE',
            suspensionReason: undefined,
          };
        }
        return s;
      })
    );
  };

  const updateSource = (sourceId: string, updates: Partial<MedicalSource>) => {
    api.admin.updateSource(sourceId, updates).catch((e) => console.debug('MongoDB update source note:', e));

    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          const updated = { ...s, ...updates };
          addAuditLog(
            'ORGANIZATION_UPDATED',
            updated.name,
            updated.type,
            `Admin ${currentUser.name} modified organization details (Address: ${updated.address}, Phone: ${updated.phone}).`
          );
          return updated;
        }
        return s;
      })
    );
  };

  const softDeleteSource = (sourceId: string, reason = 'Admin soft-deleted organization') => {
    api.admin.deleteSource(sourceId, reason).catch((e) => console.debug('MongoDB delete note:', e));
    setSources((prev) =>
      prev.map((s) => {
        if (s.id === sourceId) {
          addAuditLog(
            'ORGANIZATION_DELETED',
            s.name,
            s.type,
            `Organization soft-deleted (records preserved for audits): ${reason}`
          );

          return {
            ...s,
            isDeleted: true,
            isVerified: false,
            accountStatus: 'DELETED',
          };
        }
        return s;
      })
    );
  };

  const broadcastShortageAlert = (
    medicineName: string,
    shortageType: 'OUT_OF_STOCK' | 'CRITICAL_LOW',
    currentStock: number,
    threshold: number,
    targetRole: 'ALL' | 'PHARMACY' | 'HOSPITAL' = 'ALL',
    customMessage?: string
  ) => {
    const isOut = shortageType === 'OUT_OF_STOCK';
    const title = isOut
      ? `🚨 CRITICAL OUT OF STOCK: ${medicineName}`
      : `⚠️ MINIMUM STOCK ALERT: ${medicineName}`;
    const message =
      customMessage ||
      `Tisaiyanvilai (627657) Healthcare Alert: Total network stock of ${medicineName} has fallen to ${currentStock} units (Minimum Threshold: ${threshold} units). All ${targetRole.toLowerCase()} facilities are advised to update inventory, prioritize emergency cases, and initiate stock replenishment.`;

    const newNotif: NotificationItem = {
      id: `NOTIF-SHORTAGE-${Date.now()}`,
      title,
      message,
      type: 'SHORTAGE',
      timestamp: 'Just now',
      read: false,
      link: '/admin',
      targetRole,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    api.notifications.create(newNotif).catch((e) => console.debug('MongoDB broadcast note:', e));

    addAuditLog(
      'SHORTAGE_ALERT_DISPATCHED',
      'MedShare Central Admin Command',
      'SYSTEM',
      `Broadcasted ${shortageType} alert for ${medicineName} (Stock: ${currentStock}/${threshold}) to ${targetRole} nodes.`
    );
  };

  const registerOrganization = (
    sourceData: Omit<MedicalSource, 'id' | 'verificationStatus' | 'accountStatus' | 'isVerified' | 'isDeleted' | 'rating'>
  ): MedicalSource => {
    const newId = `SRC-${sourceData.type === 'PHARMACY' ? 'PHARM' : 'HOSP'}-REG-${Math.floor(100 + Math.random() * 900)}`;
    const newSource: MedicalSource = {
      ...sourceData,
      id: newId,
      isVerified: false,
      verificationStatus: 'PENDING',
      accountStatus: 'PENDING',
      isDeleted: false,
      rating: 5.0,
      submittedAt: new Date().toISOString(),
    };

    setSources((prev) => [newSource, ...prev]);

    addAuditLog(
      'ORGANIZATION_APPROVED', // Action queue log
      newSource.name,
      newSource.type,
      `New ${newSource.type.toLowerCase()} registration submitted for verification review. Reg ID: ${newSource.registrationNumber}`
    );

    const notif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: `📑 Verification Pending: ${newSource.name}`,
      message: `A new ${newSource.type.toLowerCase()} applied for network verification in ${newSource.city}.`,
      type: 'INFO',
      timestamp: 'Just now',
      read: false,
      link: '/admin',
      targetRole: 'ADMIN',
    };
    setNotifications((prev) => [notif, ...prev]);

    return newSource;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetToDemoData = () => {
    localStorage.clear();
    setSources(MOCK_SOURCES);
    setInventory(INITIAL_INVENTORY);
    setReservations(INITIAL_RESERVATIONS);
    setEmergencyRequests(INITIAL_EMERGENCY_REQUESTS);
    setDirectRequests(INITIAL_DIRECT_REQUESTS);
    setTransfers(INITIAL_TRANSFERS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setStockChangeLogs([]);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(MOCK_USERS.patient);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        register,
        logout,
        switchRole,
        updateUserProfile,
        medicines,
        sources,
        inventory,
        reservations,
        emergencyRequests,
        directRequests,
        transfers,
        auditLogs,
        stockChangeLogs,
        notifications,
        unreadCount,
        createReservation,
        updateReservationStatus,
        cancelReservation,
        createEmergencyRequest,
        updateEmergencyStatus,
        sendDirectHospitalRequest,
        respondToDirectHospitalRequest,
        addInventoryItem,
        updateInventoryQuantity,
        deleteInventoryItem,
        createStockTransfer,
        updateTransferStatus,
        approveSource,
        rejectSource,
        suspendSource,
        reactivateSource,
        updateSource,
        softDeleteSource,
        registerOrganization,
        broadcastShortageAlert,
        addAuditLog,
        markNotificationRead,
        markAllNotificationsRead,
        resetToDemoData,
        dbStatus,
        dbName,
        refreshFromDatabase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
