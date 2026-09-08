import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { SEED_SOURCES, SEED_MEDICINES, SEED_INVENTORY, SEED_USERS } from './seedData.js';

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'medshare_db';

let mongoClient = null;
let mongoDb = null;
let isMongoConnected = false;

// Secure Password Hashing Helpers
function hashPassword(password, salt = null) {
  const currentSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, currentSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: currentSalt };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

// In-Memory Fallback State (with pre-hashed users)
const memoryDb = {
  sources: JSON.parse(JSON.stringify(SEED_SOURCES)),
  medicines: JSON.parse(JSON.stringify(SEED_MEDICINES)),
  inventory: JSON.parse(JSON.stringify(SEED_INVENTORY)),
  users: SEED_USERS.map((u) => {
    const { hash, salt } = hashPassword(u.plainPassword);
    return {
      _id: u.id,
      id: u.id,
      name: u.name,
      email: u.email.toLowerCase().trim(),
      role: u.role,
      sourceId: u.sourceId || null,
      phone: u.phone || '',
      city: u.city || 'Tisaiyanvilai',
      district: u.district || 'Tirunelveli',
      state: u.state || 'Tamil Nadu',
      pincode: u.pincode || '627657',
      accountStatus: u.accountStatus || 'ACTIVE',
      verificationStatus: u.verificationStatus || 'APPROVED',
      passwordHash: hash,
      passwordSalt: salt,
    };
  }),
  auditLogs: [],
  reservations: [],
  emergencyRequests: [],
  directRequests: [],
  notifications: [],
};

// Initialize MongoDB Connection & Collections
async function initMongo() {
  try {
    console.log(`📡 Connecting to MongoDB at ${MONGO_URI}...`);
    mongoClient = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 2500 });
    await mongoClient.connect();
    mongoDb = mongoClient.db(DB_NAME);
    isMongoConnected = true;
    console.log(`✅ [MongoDB Compass] Connected successfully to database: "${DB_NAME}"`);

    // Sync / Upsert Seed Users into 'users' collection with hashed passwords
    console.log('🌱 Syncing user accounts with secure password hashes into MongoDB...');
    for (const u of SEED_USERS) {
      const { hash, salt } = hashPassword(u.plainPassword);
      const userRecord = {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email.toLowerCase().trim(),
        role: u.role,
        sourceId: u.sourceId || null,
        phone: u.phone || '',
        city: u.city || 'Tisaiyanvilai',
        district: u.district || 'Tirunelveli',
        state: u.state || 'Tamil Nadu',
        pincode: u.pincode || '627657',
        accountStatus: u.accountStatus || 'ACTIVE',
        verificationStatus: u.verificationStatus || 'APPROVED',
        passwordHash: hash,
        passwordSalt: salt,
      };

      await mongoDb.collection('users').updateOne(
        { email: userRecord.email },
        { $set: userRecord },
        { upsert: true }
      );
    }

    // Upsert Medical Sources
    for (const src of SEED_SOURCES) {
      await mongoDb.collection('medical_sources').updateOne(
        { id: src.id },
        { $set: { ...src, _id: src.id } },
        { upsert: true }
      );
    }

    // Upsert Medicines
    for (const med of SEED_MEDICINES) {
      await mongoDb.collection('medicines').updateOne(
        { id: med.id },
        { $set: { ...med, _id: med.id } },
        { upsert: true }
      );
    }

    // Upsert Inventories
    for (const inv of SEED_INVENTORY) {
      await mongoDb.collection('medicine_inventories').updateOne(
        { id: inv.id },
        { $set: { ...inv, _id: inv.id } },
        { upsert: true }
      );
    }

    const usersCount = await mongoDb.collection('users').countDocuments({});
    const sourcesCount = await mongoDb.collection('medical_sources').countDocuments({ isDeleted: { $ne: true } });
    const medsCount = await mongoDb.collection('medicines').countDocuments({});
    const invCount = await mongoDb.collection('medicine_inventories').countDocuments({});
    console.log(`🎉 [MongoDB Compass] Synchronization complete in "medshare_db":`);
    console.log(`   👤 ${usersCount} Total Users (Admin, 10 Pharmacies, 5 Hospitals, Citizen Patients)`);
    console.log(`   🏥 ${sourcesCount} Total Medical Facilities (10 Pharmacies + 5 Multi-Speciality Hospitals)`);
    console.log(`   💊 ${medsCount} Essential & Emergency Medicines`);
    console.log(`   📦 ${invCount} Live Inventory Batch Lines`);
  } catch (err) {
    isMongoConnected = false;
    console.warn(`⚠️ MongoDB connection note (${err.message}). Using in-memory store.`);
  }
}

initMongo();

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // Health Check
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'UP',
        database: isMongoConnected ? 'MongoDB' : 'Memory',
        timestamp: new Date().toISOString(),
      });
    }

    // Sources / Facilities
    if (pathname === '/api/sources' && method === 'GET') {
      if (isMongoConnected) {
        const sources = await mongoDb.collection('medical_sources').find({}).toArray();
        return sendJson(res, 200, sources);
      }
      return sendJson(res, 200, memoryDb.sources);
    }

    // ==========================================
    // 1. REAL AUTHENTICATION & LOGIN (MONGODB)
    // ==========================================
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').toLowerCase().trim();
      const password = body.password || '';

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Please provide both email and password.' });
      }

      let user = null;
      if (isMongoConnected) {
        user = await mongoDb.collection('users').findOne({ email });
      } else {
        user = memoryDb.users.find((u) => u.email === email);
      }

      if (!user) {
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }

      const isValid = verifyPassword(password, user.passwordHash, user.passwordSalt);
      if (!isValid) {
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }

      if (user.accountStatus === 'DELETED') {
        return sendJson(res, 403, {
          error: 'This facility account has been permanently decommissioned by the Administrator.',
        });
      }

      // If user has a linked facility, retrieve its current verification status
      let sourceData = null;
      if (user.sourceId) {
        if (isMongoConnected) {
          sourceData = await mongoDb.collection('medical_sources').findOne({ id: user.sourceId });
        } else {
          sourceData = memoryDb.sources.find((s) => s.id === user.sourceId);
        }
      }

      const sanitizedUser = {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sourceId: user.sourceId || null,
        phone: user.phone || '',
        city: user.city || 'Tisaiyanvilai',
        district: user.district || 'Tirunelveli',
        state: user.state || 'Tamil Nadu',
        pincode: user.pincode || '627657',
        accountStatus: sourceData ? sourceData.accountStatus : user.accountStatus || 'ACTIVE',
        verificationStatus: sourceData ? sourceData.verificationStatus : user.verificationStatus || 'APPROVED',
        source: sourceData,
      };

      return sendJson(res, 200, sanitizedUser);
    }

    // ==========================================
    // 2. ROLE-FIRST REGISTRATION (MONGODB)
    // ==========================================
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').toLowerCase().trim();
      let role = (body.role || 'PATIENT').toUpperCase();
      if (role === 'USER') {
        role = 'PATIENT';
      }
      const password = body.password || '';

      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password are required.' });
      }

      // Mandatory official domain enforcement
      if (role === 'PHARMACY') {
        if (!email.endsWith('@pharm.com')) {
          return sendJson(res, 400, {
            error: 'Pharmacy registration strictly requires an official facility email ending with @pharm.com (e.g., pharmacyname@pharm.com). Other email domains are not accepted.'
          });
        }
      }

      if (role === 'HOSPITAL') {
        if (!email.endsWith('@hos.com')) {
          return sendJson(res, 400, {
            error: 'Hospital registration strictly requires an official network email ending with @hos.com (e.g., hospitalname@hos.com). Other email domains are not accepted.'
          });
        }
      }

      // Check for duplicate account
      let existingUser = null;
      if (isMongoConnected) {
        existingUser = await mongoDb.collection('users').findOne({ email });
      } else {
        existingUser = memoryDb.users.find((u) => u.email === email);
      }

      if (existingUser) {
        return sendJson(res, 400, { error: 'An account with this email address already exists.' });
      }

      const { hash, salt } = hashPassword(password);
      const userId = `usr-${role.toLowerCase().slice(0, 4)}-${Date.now().toString().slice(-4)}`;

      let sourceId = null;
      let newSource = null;

      if (role === 'PHARMACY' || role === 'HOSPITAL') {
        sourceId = `SRC-${role === 'PHARMACY' ? 'PHARM' : 'HOSP'}-${Date.now().toString().slice(-4)}`;
        newSource = {
          _id: sourceId,
          id: sourceId,
          name: body.organizationName || body.name,
          type: role,
          ownerName: body.authorizedPerson || body.ownerName || body.name,
          address: body.address || `${body.doorNumber || ''} ${body.street || ''}`.trim() || 'Tisaiyanvilai',
          area: body.area || 'Main Town',
          city: body.city || 'Tisaiyanvilai',
          district: body.district || 'Tirunelveli',
          state: body.state || 'Tamil Nadu',
          pincode: body.pincode || '627657',
          phone: body.phone || body.contactNumber || '',
          email: email,
          operatingHours: body.operatingHours || (role === 'HOSPITAL' ? '24 Hours Emergency' : '08:00 AM - 10:00 PM'),
          openingTime: body.openingTime || (role === 'HOSPITAL' ? '12:00 AM' : '08:00 AM'),
          closingTime: body.closingTime || (role === 'HOSPITAL' ? '11:59 PM' : '10:00 PM'),
          availabilityStatus: 'ACTIVE_ONLINE',
          isVerified: false,
          verificationStatus: 'PENDING',
          accountStatus: 'PENDING_VERIFICATION',
          isDeleted: false,
          latitude: Number(body.latitude) || 8.4184,
          longitude: Number(body.longitude) || 77.8732,
          rating: 5.0,
          emergencySupport24x7: Boolean(body.emergencySupport24x7 || role === 'HOSPITAL'),
          registrationNumber: body.registrationNumber || body.licenseNumber || `REG-${Date.now().toString().slice(-5)}`,
          documentUrl: body.documentUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
          logoUrl:
            body.logoUrl ||
            (role === 'HOSPITAL'
              ? 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150'
              : 'https://images.unsplash.com/photo-1586015555751-63c237841c7b?w=150'),
          submittedAt: new Date().toISOString(),
        };

        if (isMongoConnected) {
          await mongoDb.collection('medical_sources').insertOne(newSource);
        }
        memoryDb.sources.push(newSource);

        // Notify Administrator
        const adminNotif = {
          _id: `NOTIF-REG-${Date.now()}`,
          id: `NOTIF-REG-${Date.now()}`,
          title: `📑 Verification Pending: ${newSource.name}`,
          message: `New ${role.toLowerCase()} registered (${newSource.name}, License: ${newSource.registrationNumber}). Awaiting admin verification.`,
          type: 'INFO',
          timestamp: 'Just now',
          read: false,
          link: '/admin',
          targetRole: 'ADMIN',
        };
        if (isMongoConnected) {
          await mongoDb.collection('notifications').insertOne(adminNotif);
        }
        memoryDb.notifications.unshift(adminNotif);
      }

      const newUser = {
        _id: userId,
        id: userId,
        name: body.name || body.organizationName,
        email: email,
        role: role,
        sourceId: sourceId,
        phone: body.phone || body.contactNumber || '',
        address: body.address || '',
        city: body.city || 'Tisaiyanvilai',
        district: body.district || 'Tirunelveli',
        state: body.state || 'Tamil Nadu',
        pincode: body.pincode || '627657',
        accountStatus: role === 'PATIENT' ? 'ACTIVE' : 'PENDING_VERIFICATION',
        verificationStatus: role === 'PATIENT' ? 'APPROVED' : 'PENDING',
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
      };

      if (isMongoConnected) {
        await mongoDb.collection('users').insertOne(newUser);
      }
      memoryDb.users.push(newUser);

      // Audit Log
      const auditLog = {
        _id: `AUD-REG-${Date.now()}`,
        id: `AUD-REG-${Date.now()}`,
        action: 'ORGANIZATION_APPROVED',
        organizationName: newUser.name,
        organizationType: role === 'PHARMACY' ? 'PHARMACY' : role === 'HOSPITAL' ? 'HOSPITAL' : 'PATIENT',
        performedBy: newUser.name,
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        reason: `Self-registration submitted for MedShare ${role.toLowerCase()} account.`,
      };
      if (isMongoConnected) {
        await mongoDb.collection('audit_logs').insertOne(auditLog);
      }
      memoryDb.auditLogs.unshift(auditLog);

      const sanitized = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        sourceId: newUser.sourceId,
        phone: newUser.phone,
        city: newUser.city,
        accountStatus: newUser.accountStatus,
        verificationStatus: newUser.verificationStatus,
        source: newSource,
      };

      return sendJson(res, 201, sanitized);
    }

    // ==========================================
    // 2.5 MEDICAL SOURCES / FACILITIES
    // ==========================================
    if (pathname === '/api/sources' && method === 'GET') {
      if (isMongoConnected) {
        const list = await mongoDb.collection('medical_sources').find({ isDeleted: { $ne: true } }).toArray();
        return sendJson(res, 200, list);
      }
      return sendJson(res, 200, memoryDb.sources.filter((s) => !s.isDeleted));
    }

    // ==========================================
    // 3. MEDICINES CATALOG
    // ==========================================
    if (pathname === '/api/medicines' && method === 'GET') {
      if (isMongoConnected) {
        const meds = await mongoDb.collection('medicines').find({}).toArray();
        return sendJson(res, 200, meds);
      }
      return sendJson(res, 200, memoryDb.medicines);
    }

    if (pathname === '/api/medicines/search' && method === 'GET') {
      const query = (parsedUrl.searchParams.get('query') || '').toLowerCase();
      const category = parsedUrl.searchParams.get('category');

      if (isMongoConnected) {
        const filter = {};
        if (query) {
          filter.$or = [
            { name: { $regex: query, $options: 'i' } },
            { genericName: { $regex: query, $options: 'i' } },
          ];
        }
        if (category && category !== 'ALL') {
          filter.category = category;
        }
        const meds = await mongoDb.collection('medicines').find(filter).toArray();
        return sendJson(res, 200, meds);
      }

      const filtered = memoryDb.medicines.filter((m) => {
        const matchesQ = !query || m.name.toLowerCase().includes(query) || m.genericName.toLowerCase().includes(query);
        const matchesC = !category || category === 'ALL' || m.category === category;
        return matchesQ && matchesC;
      });
      return sendJson(res, 200, filtered);
    }

    // ==========================================
    // 4. INVENTORY MANAGEMENT (ADD, UPDATE, DELETE)
    // ==========================================
    if (pathname === '/api/inventory' && method === 'GET') {
      if (isMongoConnected) {
        const inv = await mongoDb.collection('medicine_inventories').find({}).toArray();
        return sendJson(res, 200, inv);
      }
      return sendJson(res, 200, memoryDb.inventory);
    }

    if (pathname.startsWith('/api/inventory/source/') && method === 'GET') {
      const sourceId = pathname.split('/').pop();
      if (isMongoConnected) {
        const list = await mongoDb.collection('medicine_inventories').find({ sourceId }).toArray();
        return sendJson(res, 200, list);
      }
      const list = memoryDb.inventory.filter((i) => i.sourceId === sourceId);
      return sendJson(res, 200, list);
    }

    // Add or Update Inventory Line
    if (pathname === '/api/inventory/update' && method === 'POST') {
      const body = await parseBody(req);
      const safeQty = Math.max(0, parseInt(body.quantity || '0', 10));

      const updateData = {
        sourceId: body.sourceId,
        medicineId: body.medicineId,
        medicineName: body.medicineName,
        dosage: body.dosage || 'Standard',
        quantity: safeQty,
        batchNumber: body.batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
        expiryDate: body.expiryDate || '2027-12-31',
        unitPrice: body.unitPrice || 50,
        updatedAt: new Date().toISOString(),
        expiryStatus: 'SAFE',
        stockStatus: safeQty === 0 ? 'OUT_OF_STOCK' : safeQty <= 15 ? 'CRITICAL' : safeQty <= 35 ? 'LOW' : 'GOOD',
        latitude: 8.4184,
        longitude: 77.8732,
      };

      if (isMongoConnected) {
        await mongoDb.collection('medicine_inventories').updateOne(
          { sourceId: body.sourceId, medicineId: body.medicineId },
          { $set: updateData },
          { upsert: true }
        );
        const item = await mongoDb.collection('medicine_inventories').findOne({
          sourceId: body.sourceId,
          medicineId: body.medicineId,
        });
        return sendJson(res, 200, item);
      }

      const existingIdx = memoryDb.inventory.findIndex(
        (i) => i.sourceId === body.sourceId && i.medicineId === body.medicineId
      );
      if (existingIdx >= 0) {
        memoryDb.inventory[existingIdx] = { ...memoryDb.inventory[existingIdx], ...updateData };
        return sendJson(res, 200, memoryDb.inventory[existingIdx]);
      } else {
        const newItem = { id: `INV-${Date.now().toString().slice(-4)}`, ...updateData };
        memoryDb.inventory.push(newItem);
        return sendJson(res, 200, newItem);
      }
    }

    // Delete or Archive Inventory Item
    if (pathname.startsWith('/api/inventory/') && method === 'DELETE') {
      const invId = pathname.split('/').pop();
      if (isMongoConnected) {
        await mongoDb.collection('medicine_inventories').deleteOne({ id: invId });
        return sendJson(res, 200, { success: true, deletedId: invId });
      }
      memoryDb.inventory = memoryDb.inventory.filter((i) => i.id !== invId);
      return sendJson(res, 200, { success: true, deletedId: invId });
    }

    // ==========================================
    // 5. EMERGENCY REQUESTS & DIRECT HOSPITAL REQUESTS
    // ==========================================
    if (pathname === '/api/emergency/requests' && method === 'GET') {
      if (isMongoConnected) {
        const list = await mongoDb.collection('emergency_requests').find({}).sort({ createdAt: -1 }).toArray();
        return sendJson(res, 200, list);
      }
      return sendJson(res, 200, memoryDb.emergencyRequests);
    }

    if (pathname === '/api/emergency/requests' && method === 'POST') {
      const body = await parseBody(req);
      const newEmr = {
        _id: `EMR-${Math.floor(1000 + Math.random() * 9000)}`,
        id: `EMR-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'MATCHED',
        createdAt: new Date().toISOString(),
        matchedSourcesCount: 3,
        ...body,
      };

      if (isMongoConnected) {
        await mongoDb.collection('emergency_requests').insertOne(newEmr);
      }
      memoryDb.emergencyRequests.unshift(newEmr);
      return sendJson(res, 200, newEmr);
    }

    // Hospital -> Pharmacy Direct Requests
    if (pathname === '/api/emergency/direct-requests' && method === 'GET') {
      if (isMongoConnected) {
        const list = await mongoDb.collection('direct_pharmacy_requests').find({}).sort({ createdAt: -1 }).toArray();
        return sendJson(res, 200, list);
      }
      return sendJson(res, 200, memoryDb.directRequests);
    }

    if (pathname === '/api/emergency/direct-requests' && method === 'POST') {
      const body = await parseBody(req);
      const newReq = {
        _id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        ...body,
      };

      if (isMongoConnected) {
        await mongoDb.collection('direct_pharmacy_requests').insertOne(newReq);
      }
      memoryDb.directRequests.unshift(newReq);
      return sendJson(res, 200, newReq);
    }

    if (pathname.includes('/api/emergency/direct-requests/') && pathname.endsWith('/respond') && method === 'PATCH') {
      const id = pathname.split('/')[4];
      const status = parsedUrl.searchParams.get('status');
      const fulfilledQty = parseInt(parsedUrl.searchParams.get('fulfilledQuantity') || '0', 10);
      const notes = parsedUrl.searchParams.get('notes') || '';

      if (isMongoConnected) {
        await mongoDb.collection('direct_pharmacy_requests').updateOne(
          { id },
          { $set: { status, acceptedQuantity: fulfilledQty, rejectionReason: notes, updatedAt: new Date().toISOString() } }
        );
        const item = await mongoDb.collection('direct_pharmacy_requests').findOne({ id });
        return sendJson(res, 200, item);
      }

      const reqItem = memoryDb.directRequests.find((r) => r.id === id);
      if (reqItem) {
        reqItem.status = status;
        reqItem.acceptedQuantity = fulfilledQty;
        reqItem.rejectionReason = notes;
        reqItem.updatedAt = new Date().toISOString();
        return sendJson(res, 200, reqItem);
      }
      return sendJson(res, 404, { error: 'Not found' });
    }

    // ==========================================
    // 6. RESERVATIONS (15-MIN QR HOLD)
    // ==========================================
    if (pathname === '/api/reservations' && method === 'GET') {
      if (isMongoConnected) {
        const list = await mongoDb.collection('reservations').find({}).sort({ createdAt: -1 }).toArray();
        return sendJson(res, 200, list);
      }
      return sendJson(res, 200, memoryDb.reservations);
    }

    if (pathname === '/api/reservations' && method === 'POST') {
      const body = await parseBody(req);
      const newRes = {
        _id: body.id || `MED-${Math.floor(1000 + Math.random() * 9000)}`,
        id: body.id || `MED-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        ...body,
      };

      if (isMongoConnected) {
        await mongoDb.collection('reservations').insertOne(newRes);
        await mongoDb.collection('audit_logs').insertOne({
          _id: `AUD-${Date.now().toString().slice(-6)}`,
          id: `AUD-${Date.now().toString().slice(-6)}`,
          action: 'RESERVATION_CREATED',
          organizationName: newRes.allocationBreakdown?.[0]?.sourceName || 'MedShare Network',
          organizationType: 'SYSTEM',
          performedBy: newRes.userName || 'Citizen Patient',
          date: new Date().toLocaleDateString('en-GB'),
          time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          reason: `Reserved ${newRes.totalQuantity} units of ${newRes.medicineName}. 15-min QR hold activated.`,
        });
      }
      memoryDb.reservations.unshift(newRes);
      return sendJson(res, 200, newRes);
    }

    if (pathname.startsWith('/api/reservations/') && pathname.endsWith('/status') && method === 'PATCH') {
      const id = pathname.split('/')[3];
      const status = parsedUrl.searchParams.get('status');

      if (isMongoConnected) {
        await mongoDb.collection('reservations').updateOne({ id }, { $set: { status } });
        const item = await mongoDb.collection('reservations').findOne({ id });
        return sendJson(res, 200, item);
      }

      const resItem = memoryDb.reservations.find((r) => r.id === id);
      if (resItem) {
        resItem.status = status;
        return sendJson(res, 200, resItem);
      }
      return sendJson(res, 404, { error: 'Not found' });
    }

    // ==========================================
    // 7. ADMIN MANAGEMENT & VERIFICATION CONSOLE
    // ==========================================
    if (pathname === '/api/admin/verification-queue' && method === 'GET') {
      const status = parsedUrl.searchParams.get('status') || 'PENDING';
      if (isMongoConnected) {
        const queue = await mongoDb.collection('medical_sources').find({ verificationStatus: status }).toArray();
        return sendJson(res, 200, queue);
      }
      const queue = memoryDb.sources.filter((s) => s.verificationStatus === status);
      return sendJson(res, 200, queue);
    }

    if (pathname.includes('/api/admin/sources/') && pathname.endsWith('/verify') && method === 'PATCH') {
      const id = pathname.split('/')[4];
      const status = parsedUrl.searchParams.get('status');
      const notes = parsedUrl.searchParams.get('notes') || '';

      const updateFields = {
        verificationStatus: status,
        isVerified: status === 'APPROVED',
        accountStatus: status === 'APPROVED' ? 'ACTIVE' : 'PENDING',
        verifiedAt: new Date().toISOString(),
        rejectionReason: status === 'REJECTED' ? notes : undefined,
      };

      if (isMongoConnected) {
        await mongoDb.collection('medical_sources').updateOne({ id }, { $set: updateFields });
        await mongoDb.collection('users').updateOne(
          { sourceId: id },
          { $set: { accountStatus: updateFields.accountStatus, verificationStatus: status } }
        );
        const item = await mongoDb.collection('medical_sources').findOne({ id });
        return sendJson(res, 200, item);
      }

      const src = memoryDb.sources.find((s) => s.id === id);
      if (src) {
        Object.assign(src, updateFields);
        return sendJson(res, 200, src);
      }
      return sendJson(res, 404, { error: 'Not found' });
    }

    if (pathname.includes('/api/admin/sources/') && pathname.endsWith('/suspend') && method === 'PATCH') {
      const id = pathname.split('/')[4];
      const suspend = parsedUrl.searchParams.get('suspend') === 'true';
      const reason = parsedUrl.searchParams.get('reason') || 'Administrative suspension';

      const updateFields = {
        accountStatus: suspend ? 'SUSPENDED' : 'ACTIVE',
        verificationStatus: suspend ? 'SUSPENDED' : 'APPROVED',
        isVerified: !suspend,
        suspensionReason: suspend ? reason : undefined,
      };

      if (isMongoConnected) {
        await mongoDb.collection('medical_sources').updateOne({ id }, { $set: updateFields });
        await mongoDb.collection('users').updateOne(
          { sourceId: id },
          { $set: { accountStatus: updateFields.accountStatus, verificationStatus: updateFields.verificationStatus } }
        );
        const item = await mongoDb.collection('medical_sources').findOne({ id });
        return sendJson(res, 200, item);
      }

      const src = memoryDb.sources.find((s) => s.id === id);
      if (src) {
        Object.assign(src, updateFields);
        return sendJson(res, 200, src);
      }
      return sendJson(res, 404, { error: 'Not found' });
    }

    // PUT /api/admin/sources/:id (Modify Facility Profile)
    if (pathname.startsWith('/api/admin/sources/') && method === 'PUT') {
      const id = pathname.split('/').pop();
      const body = await parseBody(req);

      if (isMongoConnected) {
        await mongoDb.collection('medical_sources').updateOne({ id }, { $set: { ...body, id } });
        const item = await mongoDb.collection('medical_sources').findOne({ id });
        return sendJson(res, 200, item);
      }

      const sourceIdx = memoryDb.sources.findIndex((s) => s.id === id);
      if (sourceIdx >= 0) {
        memoryDb.sources[sourceIdx] = { ...memoryDb.sources[sourceIdx], ...body };
        return sendJson(res, 200, memoryDb.sources[sourceIdx]);
      }
      return sendJson(res, 404, { error: 'Not found' });
    }

    // DELETE /api/admin/sources/:id (Soft-Delete)
    if (pathname.startsWith('/api/admin/sources/') && method === 'DELETE') {
      const id = pathname.split('/').pop();

      if (isMongoConnected) {
        await mongoDb.collection('medical_sources').updateOne(
          { id },
          { $set: { isDeleted: true, accountStatus: 'DELETED', isVerified: false } }
        );
        await mongoDb.collection('users').updateOne(
          { sourceId: id },
          { $set: { accountStatus: 'DELETED', isDeleted: true } }
        );
        const item = await mongoDb.collection('medical_sources').findOne({ id });
        return sendJson(res, 200, item);
      }

      const source = memoryDb.sources.find((s) => s.id === id);
      if (source) {
        source.isDeleted = true;
        source.accountStatus = 'DELETED';
        return sendJson(res, 200, source);
      }
      return sendJson(res, 404, { error: 'Not found' });
    }

    if (pathname === '/api/admin/audit-logs' && method === 'GET') {
      if (isMongoConnected) {
        const logs = await mongoDb.collection('audit_logs').find({}).sort({ date: -1 }).toArray();
        return sendJson(res, 200, logs);
      }
      return sendJson(res, 200, memoryDb.auditLogs);
    }

    if (pathname === '/api/admin/network-stats' && method === 'GET') {
      if (isMongoConnected) {
        const totalFacilities = await mongoDb.collection('medical_sources').countDocuments({ isDeleted: { $ne: true } });
        const invList = await mongoDb.collection('medicine_inventories').find({}).toArray();
        const activeRes = await mongoDb.collection('reservations').countDocuments({ status: 'CONFIRMED' });
        const totalEmr = await mongoDb.collection('emergency_requests').countDocuments({});
        return sendJson(res, 200, {
          totalFacilities,
          totalInventory: invList.reduce((acc, i) => acc + (i.quantity || 0), 0),
          activeReservations: activeRes,
          totalEmergencyAlerts: totalEmr,
        });
      }

      return sendJson(res, 200, {
        totalFacilities: memoryDb.sources.length,
        totalInventory: memoryDb.inventory.reduce((acc, i) => acc + (i.quantity || 0), 0),
        activeReservations: memoryDb.reservations.filter((r) => r.status === 'CONFIRMED').length,
        totalEmergencyAlerts: memoryDb.emergencyRequests.length,
      });
    }

    // ==========================================
    // 8. NOTIFICATIONS & SHORTAGE ALERTS
    // ==========================================
    if (pathname === '/api/notifications' && method === 'GET') {
      if (isMongoConnected) {
        const list = await mongoDb.collection('notifications').find({}).sort({ timestamp: -1 }).toArray();
        return sendJson(res, 200, list);
      }
      return sendJson(res, 200, memoryDb.notifications);
    }

    if (pathname === '/api/notifications' && method === 'POST') {
      const body = await parseBody(req);
      const newNotif = {
        _id: `NOTIF-${Date.now()}`,
        id: `NOTIF-${Date.now()}`,
        read: false,
        timestamp: 'Just now',
        ...body,
      };

      if (isMongoConnected) {
        await mongoDb.collection('notifications').insertOne(newNotif);
      }
      memoryDb.notifications.unshift(newNotif);
      return sendJson(res, 200, newNotif);
    }

    // Default 404
    sendJson(res, 404, { error: 'Endpoint not found' });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`🚀 MedShare Production Backend Service running at http://localhost:${PORT}/api/`);
});
