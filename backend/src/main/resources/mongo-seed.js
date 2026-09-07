// MedShare MongoDB Initialization & Seed Script
// Database: medshare_db
// City: Tisaiyanvilai (627657), Tamil Nadu

db = db.getSiblingDB('medshare_db');

// Drop previous collections if resetting
db.users.drop();
db.medical_sources.drop();
db.medicines.drop();
db.inventories.drop();
db.audit_logs.drop();

// 1. Users Collection
db.users.insertMany([
  {
    _id: "USR-PAT-001",
    name: "Rahul Sharma",
    email: "rahul.patient@medshare.org",
    password: "$2a$10$demoHashedPasswordHere",
    role: "PATIENT",
    phone: "+91 98765 43210",
    address: "14 Bazaar Street, Tisaiyanvilai - 627657",
    city: "Tisaiyanvilai",
    pincode: "627657",
    verificationStatus: "APPROVED",
    accountStatus: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  },
  {
    _id: "USR-PHARM-01",
    name: "CarePoint 24/7 Pharmacy",
    email: "contact@carepointpharmacy.com",
    password: "$2a$10$demoHashedPasswordHere",
    role: "PHARMACY",
    sourceId: "SRC-PHARM-01",
    phone: "+91 98220 11223",
    address: "Plot 42, Main Bazaar Road, Tisaiyanvilai - 627657",
    city: "Tisaiyanvilai",
    pincode: "627657",
    verificationStatus: "APPROVED",
    accountStatus: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1586015555751-63c237841c7b?w=150&auto=format&fit=crop&q=80"
  },
  {
    _id: "USR-HOSP-01",
    name: "Tisaiyanvilai Government Hospital & Trauma Care",
    email: "emergency@tisaiyanvilaihosp.org",
    password: "$2a$10$demoHashedPasswordHere",
    role: "HOSPITAL",
    sourceId: "SRC-HOSP-01",
    phone: "+91 98450 77889",
    address: "Udangudi Road, Near Bus Stand, Tisaiyanvilai - 627657",
    city: "Tisaiyanvilai",
    pincode: "627657",
    verificationStatus: "APPROVED",
    accountStatus: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&auto=format&fit=crop&q=80"
  },
  {
    _id: "USR-ADMIN-001",
    name: "Dr. Ananya Roy (District Drug Controller)",
    email: "admin@medshare.gov.in",
    password: "$2a$10$demoHashedPasswordHere",
    role: "ADMIN",
    phone: "+91 99000 88000",
    address: "District Health Operations Hub, Tisaiyanvilai Region - 627657",
    city: "Tisaiyanvilai",
    pincode: "627657",
    verificationStatus: "APPROVED",
    accountStatus: "ACTIVE",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  }
]);

// 2. Medical Sources
db.medical_sources.insertMany([
  {
    _id: "SRC-PHARM-01",
    name: "CarePoint 24/7 Pharmacy",
    type: "PHARMACY",
    ownerName: "S. K. Murugan",
    address: "Plot 42, Main Bazaar Road, Tisaiyanvilai - 627657",
    area: "Main Bazaar",
    city: "Tisaiyanvilai",
    district: "Tirunelveli",
    state: "Tamil Nadu",
    pincode: "627657",
    phone: "+91 98220 11223",
    email: "carepoint@medshare.org",
    operatingHours: "Open 24 Hours",
    isVerified: true,
    verificationStatus: "APPROVED",
    accountStatus: "ACTIVE",
    isDeleted: false,
    latitude: 8.4190,
    longitude: 77.8740,
    rating: 4.9,
    emergencySupport24x7: true,
    registrationNumber: "TN-TNV-2024-PH-0089"
  },
  {
    _id: "SRC-PHARM-02",
    name: "Apex Life Pharmacy",
    type: "PHARMACY",
    ownerName: "M. Antony Raj",
    address: "18 Radhapuram Road, Near Junction, Tisaiyanvilai - 627657",
    area: "Radhapuram Road",
    city: "Tisaiyanvilai",
    district: "Tirunelveli",
    state: "Tamil Nadu",
    pincode: "627657",
    phone: "+91 98331 44556",
    email: "apexlife@medshare.org",
    operatingHours: "7:00 AM – 11:30 PM",
    isVerified: true,
    verificationStatus: "APPROVED",
    accountStatus: "ACTIVE",
    isDeleted: false,
    latitude: 8.4230,
    longitude: 77.8810,
    rating: 4.7,
    emergencySupport24x7: true,
    registrationNumber: "TN-TNV-2024-PH-0112"
  },
  {
    _id: "SRC-HOSP-01",
    name: "Tisaiyanvilai Government Hospital & Trauma Care",
    type: "HOSPITAL",
    ownerName: "Dr. P. Sundaram (Medical Superintendent)",
    address: "Udangudi Road, Emergency Wing, Tisaiyanvilai - 627657",
    area: "Udangudi Road",
    city: "Tisaiyanvilai",
    district: "Tirunelveli",
    state: "Tamil Nadu",
    pincode: "627657",
    phone: "+91 98450 77889",
    email: "emergency@tisaiyanvilaihosp.org",
    operatingHours: "Emergency Pharmacy 24/7",
    isVerified: true,
    verificationStatus: "APPROVED",
    accountStatus: "ACTIVE",
    isDeleted: false,
    latitude: 8.4280,
    longitude: 77.8650,
    rating: 4.9,
    emergencySupport24x7: true,
    registrationNumber: "TN-GOV-HOSP-TNV-004"
  }
]);

// 3. Medicines Catalog
db.medicines.insertMany([
  {
    _id: "MED-01",
    name: "Paracetamol 500mg",
    genericName: "Acetaminophen 500mg",
    category: "Analgesics & Antipyretics",
    dosage: "500mg Tablet",
    unit: "tablets",
    description: "First-line emergency antipyretic and analgesic.",
    criticalThreshold: 50,
    lowThreshold: 150,
    averageDailyDemand: 80
  },
  {
    _id: "MED-02",
    name: "Insulin Glargine 100 IU/ml",
    genericName: "Recombinant Long-Acting Insulin",
    category: "Endocrinology / Emergency Diabetology",
    dosage: "100 IU/ml (3ml Vial)",
    unit: "vials",
    description: "Critical 24-hour basal insulin required for glycemic stabilization.",
    criticalThreshold: 15,
    lowThreshold: 40,
    averageDailyDemand: 25
  },
  {
    _id: "MED-03",
    name: "Adrenaline (Epinephrine) 1:1000",
    genericName: "Epinephrine Injection 1mg/ml",
    category: "Emergency Resuscitation",
    dosage: "1mg / 1ml Ampoule",
    unit: "ampoules",
    description: "Life-saving emergency sympathomimetic for anaphylactic shock.",
    criticalThreshold: 10,
    lowThreshold: 30,
    averageDailyDemand: 18
  },
  {
    _id: "MED-04",
    name: "Anti-Snake Venom (Polyvalent ASV)",
    genericName: "Lyophilized Polyvalent Anti-Snake Venom Serum",
    category: "Toxicology",
    dosage: "10ml Reconstituted Vial",
    unit: "vials",
    description: "Neutralizes venoms of Russell Viper, Cobra, and Krait.",
    criticalThreshold: 8,
    lowThreshold: 20,
    averageDailyDemand: 6
  }
]);

// 4. Inventories
db.inventories.insertMany([
  {
    _id: "INV-001",
    medicineId: "MED-01",
    medicineName: "Paracetamol 500mg",
    sourceId: "SRC-PHARM-01",
    sourceName: "CarePoint 24/7 Pharmacy",
    sourceType: "PHARMACY",
    quantity: 120,
    batchNumber: "BT-PCM-881",
    expiryDate: new Date("2027-08-20"),
    unitPrice: 2.5,
    expiryStatus: "SAFE",
    stockStatus: "GOOD",
    latitude: 8.4190,
    longitude: 77.8740,
    dosage: "500mg Tablet",
    unit: "tablets",
    updatedAt: new Date()
  },
  {
    _id: "INV-004",
    medicineId: "MED-02",
    medicineName: "Insulin Glargine 100 IU/ml",
    sourceId: "SRC-PHARM-01",
    sourceName: "CarePoint 24/7 Pharmacy",
    sourceType: "PHARMACY",
    quantity: 8,
    batchNumber: "BT-INS-992",
    expiryDate: new Date("2026-12-15"),
    unitPrice: 580.0,
    expiryStatus: "SAFE",
    stockStatus: "CRITICAL",
    latitude: 8.4190,
    longitude: 77.8740,
    dosage: "100 IU/ml Vial",
    unit: "vials",
    updatedAt: new Date()
  }
]);

// 5. Audit Logs
db.audit_logs.insertMany([
  {
    _id: "AUD-001",
    action: "ORGANIZATION_APPROVED",
    organizationName: "CarePoint 24/7 Pharmacy",
    organizationType: "PHARMACY",
    performedBy: "Dr. Ananya Roy (Admin)",
    date: "2026-09-06",
    time: "09:30 AM",
    reason: "Drug license verified with TN Pharmacy Council portal.",
    timestamp: new Date()
  }
]);

print("MedShare MongoDB seed data successfully initialized for Tisaiyanvilai (627657)!");
