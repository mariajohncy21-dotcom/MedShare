import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import https from 'https';
import { MongoClient } from 'mongodb';
import { SEED_SOURCES, SEED_MEDICINES, SEED_INVENTORY, SEED_USERS } from './seedData.js';

// ==========================================
// JWT HELPERS (no external dependency)
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'medshare-sih-jwt-secret-2026-tisaiyanvilai';
const JWT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function base64urlEncode(str) {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function signJWT(payload) {
  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + JWT_EXPIRY_MS }));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return `${header}.${body}.${sig}`;
}

function verifyJWT(token) {
  try {
    const parts = (token || '').split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64').toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// requireAuth: authenticate request and optionally check allowed roles
// Returns { user } on success, or sends 401/403 and returns null
async function requireAuth(req, res, allowedRoles = []) {
  const token = extractToken(req);
  if (!token) {
    sendJson(res, 401, { error: 'Authentication required. Please log in.' });
    return null;
  }
  const payload = verifyJWT(token);
  if (!payload) {
    sendJson(res, 401, { error: 'Session expired or invalid. Please log in again.' });
    return null;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    sendJson(res, 403, { error: `Access denied. This action requires one of: ${allowedRoles.join(', ')}.` });
    return null;
  }
  // Check account not suspended/deleted
  if (payload.accountStatus === 'DELETED') {
    sendJson(res, 403, { error: 'This account has been permanently decommissioned.' });
    return null;
  }
  if (payload.accountStatus === 'SUSPENDED') {
    sendJson(res, 403, { error: 'This account has been suspended. Contact the administrator.' });
    return null;
  }
  return payload;
}

// AI Chat Rate Limiting (simple in-memory)
const aiRateLimit = new Map(); // userId -> { count, windowStart }
const AI_RATE_LIMIT = 30; // requests per window
const AI_RATE_WINDOW_MS = 60 * 1000; // 1 minute

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

      const token = signJWT({
        id: sanitizedUser.id,
        email: sanitizedUser.email,
        role: sanitizedUser.role,
        sourceId: sanitizedUser.sourceId || null,
        accountStatus: sanitizedUser.accountStatus,
        name: sanitizedUser.name,
      });
      return sendJson(res, 200, { ...sanitizedUser, token });
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

      const token = signJWT({
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        sourceId: newUser.sourceId || null,
        accountStatus: newUser.accountStatus,
        name: newUser.name,
      });
      return sendJson(res, 201, { ...sanitized, token });
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

    // NOTE: /api/inventory/update POST is handled below with proper RBAC auth

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

    // ==========================================
    // HOSPITAL PATIENT MANAGEMENT
    // ==========================================
    if (pathname === '/api/hospital/patients' && method === 'GET') {
      const authUser = await requireAuth(req, res, ['HOSPITAL', 'ADMIN']);
      if (!authUser) return;
      const hospitalId = authUser.role === 'ADMIN' ? (parsedUrl.searchParams.get('hospitalId') || null) : authUser.sourceId;
      const filter = { isDeleted: { $ne: true } };
      if (hospitalId) filter.hospitalId = hospitalId;
      if (isMongoConnected) {
        const patients = await mongoDb.collection('hospital_patients').find(filter).sort({ admissionDate: -1 }).toArray();
        return sendJson(res, 200, patients);
      }
      const memPatients = (memoryDb.hospitalPatients || []).filter(p =>
        (!hospitalId || p.hospitalId === hospitalId) && !p.isDeleted
      );
      return sendJson(res, 200, memPatients);
    }

    if (pathname === '/api/hospital/patients' && method === 'POST') {
      const authUser = await requireAuth(req, res, ['HOSPITAL']);
      if (!authUser) return;
      const body = await parseBody(req);
      const patientId = `PAT-${Date.now().toString().slice(-6)}`;
      const newPatient = {
        _id: patientId,
        id: patientId,
        hospitalId: authUser.sourceId,
        name: body.name || 'Unknown Patient',
        age: body.age || null,
        gender: body.gender || 'Unknown',
        contact: body.contact || '',
        admissionDate: body.admissionDate || new Date().toISOString().split('T')[0],
        ward: body.ward || 'General',
        bed: body.bed || '',
        emergencyStatus: body.emergencyStatus || 'STABLE',
        department: body.department || 'General Medicine',
        status: body.status || 'ADMITTED',
        notes: body.notes || '',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        createdBy: authUser.id,
      };
      if (isMongoConnected) {
        await mongoDb.collection('hospital_patients').insertOne(newPatient);
        return sendJson(res, 201, newPatient);
      }
      if (!memoryDb.hospitalPatients) memoryDb.hospitalPatients = [];
      memoryDb.hospitalPatients.unshift(newPatient);
      return sendJson(res, 201, newPatient);
    }

    if (pathname.startsWith('/api/hospital/patients/') && method === 'PUT') {
      const authUser = await requireAuth(req, res, ['HOSPITAL', 'ADMIN']);
      if (!authUser) return;
      const patientId = pathname.split('/').pop();
      const body = await parseBody(req);
      // Ownership check: hospital can only update its own patients
      if (authUser.role === 'HOSPITAL') {
        const existing = isMongoConnected
          ? await mongoDb.collection('hospital_patients').findOne({ id: patientId })
          : (memoryDb.hospitalPatients || []).find(p => p.id === patientId);
        if (!existing || existing.hospitalId !== authUser.sourceId) {
          return sendJson(res, 403, { error: 'You can only update patients belonging to your hospital.' });
        }
      }
      if (isMongoConnected) {
        await mongoDb.collection('hospital_patients').updateOne({ id: patientId }, { $set: { ...body, updatedAt: new Date().toISOString(), updatedBy: authUser.id } });
        const updated = await mongoDb.collection('hospital_patients').findOne({ id: patientId });
        return sendJson(res, 200, updated);
      }
      const idx = (memoryDb.hospitalPatients || []).findIndex(p => p.id === patientId);
      if (idx >= 0) {
        memoryDb.hospitalPatients[idx] = { ...memoryDb.hospitalPatients[idx], ...body, updatedAt: new Date().toISOString() };
        return sendJson(res, 200, memoryDb.hospitalPatients[idx]);
      }
      return sendJson(res, 404, { error: 'Patient not found' });
    }

    if (pathname.startsWith('/api/hospital/patients/') && method === 'DELETE') {
      const authUser = await requireAuth(req, res, ['HOSPITAL', 'ADMIN']);
      if (!authUser) return;
      const patientId = pathname.split('/').pop();
      if (isMongoConnected) {
        await mongoDb.collection('hospital_patients').updateOne({ id: patientId }, { $set: { isDeleted: true } });
        return sendJson(res, 200, { success: true });
      }
      const idx = (memoryDb.hospitalPatients || []).findIndex(p => p.id === patientId);
      if (idx >= 0) memoryDb.hospitalPatients[idx].isDeleted = true;
      return sendJson(res, 200, { success: true });
    }

    // ==========================================
    // BULK INVENTORY UPLOAD (validate, preview, commit)
    // ==========================================
    if (pathname === '/api/inventory/bulk-upload/preview' && method === 'POST') {
      const authUser = await requireAuth(req, res, ['PHARMACY', 'HOSPITAL']);
      if (!authUser) return;
      const body = await parseBody(req);
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const sourceId = authUser.sourceId;
      const valid = [];
      const invalid = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const errors = [];
        if (!r.medicineName) errors.push('Missing medicine name');
        const qty = parseInt(r.quantity, 10);
        if (isNaN(qty)) errors.push('Quantity must be a number');
        else if (qty < 0) errors.push('Quantity cannot be negative');
        if (!r.batchNumber) errors.push('Missing batch number');
        if (!r.expiryDate) errors.push('Missing expiry date');
        else if (isNaN(Date.parse(r.expiryDate))) errors.push('Invalid expiry date format (YYYY-MM-DD)');
        if (errors.length > 0) {
          invalid.push({ row: i + 1, data: r, errors });
        } else {
          valid.push({ row: i + 1, data: { ...r, quantity: qty, sourceId }, errors: [] });
        }
      }
      return sendJson(res, 200, {
        totalRows: rows.length,
        validRows: valid.length,
        invalidRows: invalid.length,
        valid,
        invalid,
      });
    }

    if (pathname === '/api/inventory/bulk-upload/commit' && method === 'POST') {
      const authUser = await requireAuth(req, res, ['PHARMACY', 'HOSPITAL']);
      if (!authUser) return;
      const body = await parseBody(req);
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const sourceId = authUser.sourceId;
      const committed = [];
      for (const row of rows) {
        const qty = Math.max(0, parseInt(row.quantity, 10) || 0);
        const invItem = {
          id: row.id || `INV-BULK-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2,5)}`,
          sourceId,
          medicineId: row.medicineId || `MED-GENERIC-${row.medicineName?.replace(/\s+/g,'').slice(0,5).toUpperCase()}`,
          medicineName: row.medicineName,
          dosage: row.dosage || row.strength || 'Standard',
          medicineType: row.medicineType || 'General',
          batchNumber: row.batchNumber,
          quantity: qty,
          unit: row.unit || 'Units',
          expiryDate: row.expiryDate,
          unitPrice: parseFloat(row.unitPrice) || 50,
          updatedAt: new Date().toISOString(),
          updatedBy: authUser.id,
          expiryStatus: 'SAFE',
          stockStatus: qty === 0 ? 'OUT_OF_STOCK' : qty <= 15 ? 'CRITICAL' : qty <= 35 ? 'LOW' : 'GOOD',
          latitude: 8.4184,
          longitude: 77.8732,
          bulkUploaded: true,
        };
        if (isMongoConnected) {
          await mongoDb.collection('medicine_inventories').updateOne(
            { sourceId, batchNumber: invItem.batchNumber, medicineName: invItem.medicineName },
            { $set: { ...invItem, _id: invItem.id } },
            { upsert: true }
          );
        } else {
          const idx = memoryDb.inventory.findIndex(i => i.sourceId === sourceId && i.batchNumber === invItem.batchNumber);
          if (idx >= 0) memoryDb.inventory[idx] = { ...memoryDb.inventory[idx], ...invItem };
          else memoryDb.inventory.push(invItem);
        }
        committed.push(invItem);
      }
      // Audit log
      const auditEntry = {
        _id: `AUD-BULK-${Date.now()}`, id: `AUD-BULK-${Date.now()}`,
        action: 'ORGANIZATION_APPROVED', organizationName: authUser.name,
        organizationType: authUser.role, performedBy: authUser.name,
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        reason: `Bulk upload: ${committed.length} inventory items imported.`,
      };
      if (isMongoConnected) await mongoDb.collection('audit_logs').insertOne(auditEntry);
      return sendJson(res, 200, { committed: committed.length, items: committed });
    }

    // ==========================================
    // GEMINI AI CHAT (Secure Server-Side Proxy)
    // ==========================================
    if (pathname === '/api/ai/chat' && method === 'POST') {
      const authUser = await requireAuth(req, res);
      if (!authUser) return;

      // Rate limiting
      const now = Date.now();
      const rl = aiRateLimit.get(authUser.id) || { count: 0, windowStart: now };
      if (now - rl.windowStart > AI_RATE_WINDOW_MS) {
        aiRateLimit.set(authUser.id, { count: 1, windowStart: now });
      } else if (rl.count >= AI_RATE_LIMIT) {
        return sendJson(res, 429, { error: 'Too many AI requests. Please wait a moment.' });
      } else {
        rl.count++;
        aiRateLimit.set(authUser.id, rl);
      }

      const body = await parseBody(req);
      const userMessage = (body.message || '').slice(0, 2000).trim();
      if (!userMessage) return sendJson(res, 400, { error: 'Message is required.' });

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
      if (!GEMINI_API_KEY) {
        return sendJson(res, 200, {
          reply: 'MedShare AI is not configured on this server. Please set the GEMINI_API_KEY environment variable to enable the AI assistant.',
          role: authUser.role,
        });
      }

      // Role-specific system prompt
      const roleContextMap = {
        PATIENT: 'You are helping a patient citizen use MedShare to find medicines, make reservations, locate nearby pharmacies and hospitals, and understand emergency medicine availability. Help them navigate the patient dashboard, find nearby sources, and understand how the 15-minute QR reservation system works.',
        PHARMACY: 'You are helping a pharmacy operator manage their MedShare pharmacy account. Help them understand inventory management, bulk uploads, responding to hospital requests (accept/partial accept/reject), managing reservations, and using the pharmacy dashboard.',
        HOSPITAL: 'You are helping a hospital staff member use MedShare. Help them with patient management, requesting medicines from nearby pharmacies, smart allocation (splitting requests across multiple pharmacies), bulk inventory uploads, emergency requests, and tracking stock transfers.',
        ADMIN: 'You are helping a MedShare system administrator. Help them with verifying pharmacies and hospitals, monitoring system-wide inventory, managing shortage alerts, reviewing audit logs, suspending or removing organizations, and overall platform management.',
      };
      const roleContext = roleContextMap[authUser.role] || roleContextMap.PATIENT;

      const systemPrompt = `You are MedShare AI, a helpful assistant for the MedShare Emergency Medicine Network platform in Tisaiyanvilai, Tamil Nadu, India.\n\nYOUR ROLE CONTEXT: ${roleContext}\n\nCRITICAL RULES:\n- You are NOT a doctor, medical professional, or diagnostic tool.\n- NEVER diagnose diseases or medical conditions.\n- NEVER prescribe medications or recommend specific medicines for medical conditions.\n- NEVER advise on medicine dosages, combinations, or treatment plans.\n- NEVER replace professional medical advice.\n- For any medical advice, health symptoms, diagnoses, or treatment questions, respond with: "I can only help with MedShare platform usage and medicine availability logistics. For medical advice, please consult a qualified healthcare professional or doctor.\'\n- Focus ONLY on: medicine availability search, reservations, nearby source finding, platform navigation, hospital-pharmacy coordination, inventory management, and MedShare system usage.\n\nPlatform tagline: \'Every Minute Matters. Find. Match. Reserve. Share.\'`;

      try {
        const geminiPayload = JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nUser (${authUser.role}): ${userMessage}` }] }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.7, topP: 0.9 },
        });

        const reply = await new Promise((resolve, reject) => {
          const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(geminiPayload) },
          };
          const req2 = https.request(options, (r) => {
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => {
              try {
                const parsed = JSON.parse(data);
                const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response. Please try again.';
                resolve(text);
              } catch { reject(new Error('Failed to parse Gemini response')); }
            });
          });
          req2.on('error', reject);
          req2.setTimeout(15000, () => { req2.destroy(); reject(new Error('Gemini API timeout')); });
          req2.write(geminiPayload);
          req2.end();
        });

        return sendJson(res, 200, { reply, role: authUser.role });
      } catch (aiErr) {
        console.warn('[MedShare AI] Gemini API error:', aiErr.message);
        return sendJson(res, 200, {
          reply: 'MedShare AI is temporarily unavailable. Please try again shortly. For urgent medicine availability, use the Search or Map features directly.',
          role: authUser.role,
        });
      }
    }

    // ==========================================
    // PROTECTED INVENTORY ENDPOINTS (ownership check)
    // ==========================================
    if (pathname === '/api/inventory/update' && method === 'POST') {
      // This route is already handled above, but add auth check here
      const authUser = await requireAuth(req, res, ['PHARMACY', 'HOSPITAL', 'ADMIN']);
      if (!authUser) return;
      const body = await parseBody(req);
      // Ownership: non-admin can only update their own source
      if (authUser.role !== 'ADMIN' && body.sourceId && body.sourceId !== authUser.sourceId) {
        return sendJson(res, 403, { error: 'You can only update inventory for your own facility.' });
      }
      const safeQty = Math.max(0, parseInt(body.quantity || '0', 10));
      const updateData = {
        sourceId: body.sourceId || authUser.sourceId,
        medicineId: body.medicineId,
        medicineName: body.medicineName,
        dosage: body.dosage || 'Standard',
        quantity: safeQty,
        batchNumber: body.batchNumber || `BATCH-${Date.now().toString().slice(-4)}`,
        expiryDate: body.expiryDate || '2027-12-31',
        unitPrice: body.unitPrice || 50,
        updatedAt: new Date().toISOString(),
        updatedBy: authUser.id,
        expiryStatus: 'SAFE',
        stockStatus: safeQty === 0 ? 'OUT_OF_STOCK' : safeQty <= 15 ? 'CRITICAL' : safeQty <= 35 ? 'LOW' : 'GOOD',
        latitude: 8.4184, longitude: 77.8732,
      };
      if (isMongoConnected) {
        await mongoDb.collection('medicine_inventories').updateOne(
          { sourceId: updateData.sourceId, medicineId: body.medicineId },
          { $set: updateData }, { upsert: true }
        );
        const item = await mongoDb.collection('medicine_inventories').findOne({ sourceId: updateData.sourceId, medicineId: body.medicineId });
        return sendJson(res, 200, item);
      }
      const existingIdx = memoryDb.inventory.findIndex(i => i.sourceId === updateData.sourceId && i.medicineId === body.medicineId);
      if (existingIdx >= 0) {
        memoryDb.inventory[existingIdx] = { ...memoryDb.inventory[existingIdx], ...updateData };
        return sendJson(res, 200, memoryDb.inventory[existingIdx]);
      } else {
        const newItem = { id: `INV-${Date.now().toString().slice(-4)}`, ...updateData };
        memoryDb.inventory.push(newItem);
        return sendJson(res, 200, newItem);
      }
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
