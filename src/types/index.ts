export type UserRole = 'PATIENT' | 'PHARMACY' | 'HOSPITAL' | 'ADMIN';

export type UrgencyLevel = 'NORMAL' | 'URGENT' | 'CRITICAL';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'COLLECTED' | 'EXPIRED' | 'CANCELLED';

export type TransferStatus = 'PENDING' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED';

export type ExpiryStatus = 'SAFE' | 'EXPIRING_SOON' | 'EXPIRED';

export type StockStatus = 'GOOD' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type AccountStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  sourceId?: string; // Linked Pharmacy or Hospital ID
  address?: string;
  avatarUrl?: string;
  verificationStatus?: VerificationStatus;
  accountStatus?: AccountStatus;
  city?: string;
  pincode?: string;
}

export interface MedicalSource {
  id: string;
  name: string;
  type: 'PHARMACY' | 'HOSPITAL';
  ownerName?: string;
  address: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  operatingHours: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  accountStatus: AccountStatus;
  isDeleted?: boolean;
  latitude: number;
  longitude: number;
  rating: number;
  emergencySupport24x7: boolean;
  registrationNumber: string;
  documentUrl?: string;
  logoUrl?: string;
  imageUrl?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  suspensionReason?: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  dosage: string;
  unit: string;
  description: string;
  criticalThreshold: number; // units below which it's critical
  lowThreshold: number;
  averageDailyDemand: number;
  sampleImageUrl?: string;
  barcode?: string;
}

export interface InventoryItem {
  id: string;
  medicineId: string;
  medicineName: string;
  sourceId: string;
  sourceName: string;
  sourceType: 'PHARMACY' | 'HOSPITAL';
  quantity: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  unitPrice: number;
  updatedAt: string;
  expiryStatus: ExpiryStatus;
  stockStatus: StockStatus;
  latitude: number;
  longitude: number;
  dosage?: string;
  unit?: string;
  lastUpdatedBy?: string;
}

export interface StockChangeLog {
  id: string;
  inventoryId: string;
  medicineName: string;
  sourceId: string;
  sourceName: string;
  previousQuantity: number;
  newQuantity: number;
  updatedBy: string;
  updatedAt: string;
  reason?: string;
}

export interface AllocationSourceItem {
  sourceId: string;
  sourceName: string;
  sourceType: 'PHARMACY' | 'HOSPITAL';
  allocatedQuantity: number;
  availableQuantity: number;
  distanceKm: number;
  estimatedMinutes: number;
  address: string;
  phone: string;
  isVerified: boolean;
  batchNumber: string;
  unitPrice: number;
}

export interface AllocationPlan {
  id: string;
  medicineId: string;
  medicineName: string;
  requestedQuantity: number;
  fulfilledQuantity: number;
  isFullyFulfilled: boolean;
  urgency: UrgencyLevel;
  totalDistanceKm: number;
  estimatedTotalMinutes: number;
  totalSourcesCount: number;
  allocatedSources: AllocationSourceItem[];
  score: number;
  planType: 'RECOMMENDED_SMART' | 'SINGLE_SOURCE_FURTHER' | 'BALANCED_SPEED';
  summaryDescription: string;
}

export interface Reservation {
  id: string; // e.g. MED-4587
  userId: string;
  userName: string;
  userPhone: string;
  medicineId: string;
  medicineName: string;
  totalQuantity: number;
  urgency: UrgencyLevel;
  status: ReservationStatus;
  createdAt: string; // ISO string
  expiresAt: string; // ISO string (15 mins from creation)
  qrToken: string;
  allocationBreakdown: {
    sourceId: string;
    sourceName: string;
    quantity: number;
    address: string;
    phone: string;
    sourceStatus: 'PENDING' | 'CONFIRMED' | 'COLLECTED';
  }[];
}

export interface EmergencyRequest {
  id: string; // e.g. EMR-8892
  patientName: string;
  patientPhone: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  urgency: 'URGENT' | 'CRITICAL';
  location: string;
  latitude?: number;
  longitude?: number;
  additionalNotes?: string;
  status: 'BROADCASTING' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
  matchedSourcesCount: number;
}

export interface DirectPharmacyRequest {
  id: string; // e.g. REQ-9012
  hospitalId: string;
  hospitalName: string;
  hospitalPhone: string;
  hospitalAddress: string;
  pharmacyId: string;
  pharmacyName: string;
  medicineId: string;
  medicineName: string;
  requestedQuantity: number;
  acceptedQuantity?: number;
  urgency: UrgencyLevel;
  requiredBy: string;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
}

export interface StockTransfer {
  id: string; // TRF-1029
  medicineId: string;
  medicineName: string;
  fromSourceId: string;
  fromSourceName: string;
  toSourceId: string;
  toSourceName: string;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  reason: 'EXPIRY_MITIGATION' | 'CRITICAL_SHORTAGE_RELIEF' | 'ROUTINE_BALANCING';
  status: TransferStatus;
  createdAt: string;
  estimatedDeliveryHours: number;
}

export interface AuditLogItem {
  id: string;
  action:
    | 'ORGANIZATION_APPROVED'
    | 'ORGANIZATION_REJECTED'
    | 'ORGANIZATION_SUSPENDED'
    | 'ORGANIZATION_REACTIVATED'
    | 'ORGANIZATION_UPDATED'
    | 'ORGANIZATION_DELETED'
    | 'SHORTAGE_ALERT_DISPATCHED'
    | 'INVENTORY_UPDATED'
    | 'EMERGENCY_REQUEST_CREATED'
    | 'DIRECT_REQUEST_ACCEPTED'
    | 'DIRECT_REQUEST_PARTIALLY_ACCEPTED'
    | 'DIRECT_REQUEST_REJECTED'
    | 'RESERVATION_CREATED'
    | 'RESERVATION_CANCELLED';
  organizationName: string;
  organizationType?: 'PHARMACY' | 'HOSPITAL' | 'SYSTEM' | 'PATIENT';
  performedBy: string;
  date: string;
  time: string;
  reason: string;
  details?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'EMERGENCY' | 'RESERVATION' | 'SHORTAGE' | 'EXPIRY' | 'TRANSFER' | 'INFO';
  timestamp: string;
  read: boolean;
  link?: string;
  targetRole?: UserRole | 'ALL';
  targetSourceId?: string;
}

export interface ImageCatalogMatch {
  medicineId: string;
  medicineName: string;
  confidence: number;
  description: string;
  packagingMatched: string;
  dosage: string;
}
