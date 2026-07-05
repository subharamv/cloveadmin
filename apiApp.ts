import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import {
  verifyCredentials,
  seedAdminUserInSheet,
  getAllUsers,
  appendUser,
  updateUser as sheetsUpdateUser,
  deleteUser as sheetsDeleteUser,
  updatePassword,
  setUserActive,
  findUserByEmail,
} from './googleSheetsAuth';
import { ensureVisitorSheetsSetup } from './googleSheetsVisitors';
import { createVisitorRouter } from './visitorRoutes';
import { ensureBillSheetsSetup } from './googleSheetsBills';
import { createBillRouter } from './billRoutes';
import { createTravelRouter } from './travelRoutes';

// The API-only Express app — shared between local dev (server.ts, which adds
// Vite middleware / static serving on top) and the Netlify Function
// (netlify/functions/api.ts, which wraps this with serverless-http). Contains
// no Vite/static-file/app.listen concerns, just the REST API surface.
export function createApiApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Fallback configuration when MongoDB isn't reachable
  let useLocalFallback = false;
  const LOCAL_DB_PATH = path.join(process.cwd(), 'local_db.json');

  function readLocalDb() {
    try {
      if (!fs.existsSync(LOCAL_DB_PATH)) {
        return { users: [], logs: [] };
      }
      const data = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return { users: [], logs: [] };
    }
  }

  function writeLocalDb(data: any) {
    try {
      fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write local DB:', err);
    }
  }

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/facility_management';

  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 } as any)
    .then(() => {
      console.log('MongoDB successfully connected.');
    })
    .catch((err: any) => {
      console.warn('MongoDB connection failed. Falling back to JSON persistent datastore storage for facility logs.', err.message);
      useLocalFallback = true;
    });

  // Seed the default administrator into the Google Sheets user store
  seedAdminUserInSheet(
    process.env.ADMIN_SEED_EMAIL || 'subharam.v@clovetech.com',
    process.env.ADMIN_SEED_PASSWORD || 'Yuva8856@',
    'Master Admin',
    'VISHAL DAS'
  ).catch((err: any) => {
    console.error('Failed to seed administrator user into Google Sheet:', err.message);
  });

  // Seed the default security account into the Google Sheets user store
  seedAdminUserInSheet(
    process.env.SECURITY_SEED_EMAIL || 'security@clovetech.com',
    process.env.SECURITY_SEED_PASSWORD || 'Security@123',
    'Security',
    'Security Guard'
  ).catch((err: any) => {
    console.error('Failed to seed security user into Google Sheet:', err.message);
  });

  ensureVisitorSheetsSetup().catch((err: any) => {
    console.error('Failed to set up visitor tracking sheets:', err.message);
  });

  ensureBillSheetsSetup().catch((err: any) => {
    console.error('Failed to set up bill payment sheets:', err.message);
  });

  // Models Definitions
  const FacilityLogSchema = new mongoose.Schema({
    pillar: { type: String, required: true, trim: true },
    reviewer: { type: String, required: true, trim: true },
    submittedAt: { type: Date, default: Date.now },
    priorityScore: { type: Number, required: true },
    telemetryData: { type: mongoose.Schema.Types.Mixed, default: {} },
  }, { timestamps: true });

  const FacilityLog = (mongoose.models.FacilityLog || mongoose.model('FacilityLog', FacilityLogSchema)) as any;

  function authMiddleware(req: any, res: any, next: any) {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization denied, token missing' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Token format is invalid, must be Bearer <token>' });
    }

    const token = parts[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-change-in-production');
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Token is not valid or has expired' });
    }
  }

  function requireRole(roles: string[]) {
    return (req: any, res: any, next: any) => {
      authMiddleware(req, res, () => {
        if (!roles.includes(req.user?.role)) {
          return res.status(403).json({ message: 'Insufficient permissions for this resource' });
        }
        next();
      });
    };
  }

  app.use('/api/visitors', createVisitorRouter(requireRole));
  app.use('/api/bills', createBillRouter(requireRole));
  app.use('/api/travel', createTravelRouter(requireRole));

  // 1. Auth Endpoint — validated against the Google Sheets user store
  app.post('/api/auth/login', async (req: express.Request, res: express.Response): Promise<any> => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
      const user = await verifyCredentials(username, password);

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const payload = {
        email: user.email,
        username: user.email,
        role: user.role
      };

      const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
      const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

      res.json({
        message: 'Authentication successful',
        token: `Bearer ${token}`,
        user: {
          username: user.email,
          role: user.role,
          name: user.name,
          active: user.active,
        }
      });
    } catch (err: any) {
      console.error('Error logging in admin:', err.message);
      res.status(500).json({ message: 'Internal server error or Google Sheets user store unavailable' });
    }
  });

  // 2. User Management Routes (Protected)
  app.get('/api/auth/users', requireRole(['Master Admin', 'Admin']), async (_req: any, res: express.Response): Promise<any> => {
    try {
      const users = await getAllUsers();
      const safe = users.map((u) => ({
        email: u.email,
        role: u.role,
        name: u.name,
        active: u.active,
        createdAt: '',
      }));
      res.json(safe);
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/auth/users', requireRole(['Master Admin']), async (req: any, res: express.Response): Promise<any> => {
    try {
      const { email, password, role, name } = req.body;
      if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required' });
      }
      const existing = await findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      await appendUser(email, password, role, name || '');
      res.status(201).json({ message: 'User created successfully' });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/auth/users/:email', requireRole(['Master Admin']), async (req: any, res: express.Response): Promise<any> => {
    try {
      const { email } = req.params;
      const { role, name } = req.body;
      const decodedEmail = decodeURIComponent(email);
      const ok = await sheetsUpdateUser(decodedEmail, { role, name });
      if (!ok) return res.status(404).json({ message: 'User not found' });
      res.json({ message: 'User updated successfully' });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/auth/users/:email', requireRole(['Master Admin']), async (req: any, res: express.Response): Promise<any> => {
    try {
      const { email } = req.params;
      const decodedEmail = decodeURIComponent(email);
      const ok = await sheetsDeleteUser(decodedEmail);
      if (!ok) return res.status(404).json({ message: 'User not found' });
      res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  app.patch('/api/auth/users/:email/password', requireRole(['Master Admin']), async (req: any, res: express.Response): Promise<any> => {
    try {
      const { email } = req.params;
      const { password } = req.body;
      if (!password) return res.status(400).json({ message: 'Password is required' });
      const decodedEmail = decodeURIComponent(email);
      const ok = await updatePassword(decodedEmail, password);
      if (!ok) return res.status(404).json({ message: 'User not found' });
      res.json({ message: 'Password reset successfully' });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  app.patch('/api/auth/users/:email/active', requireRole(['Master Admin']), async (req: any, res: express.Response): Promise<any> => {
    try {
      const { email } = req.params;
      const { active } = req.body;
      if (active === undefined) return res.status(400).json({ message: 'Active status is required' });
      const decodedEmail = decodeURIComponent(email);
      const ok = await setUserActive(decodedEmail, active);
      if (!ok) return res.status(404).json({ message: 'User not found' });
      res.json({ message: `User ${active ? 'activated' : 'deactivated'} successfully` });
    } catch (err: any) {
      res.status(500).json({ message: 'Failed to update user status' });
    }
  });

  // 3. Submit Log Entry
  app.post('/api/logs', async (req: express.Request, res: express.Response): Promise<any> => {
    const { pillar, reviewer, priorityScore, telemetryData } = req.body;

    if (!pillar || !reviewer || priorityScore === undefined) {
      return res.status(400).json({ message: 'Pillar, Reviewer, and Priority Score are required fields' });
    }

    try {
      if (useLocalFallback) {
        const db = readLocalDb();
        const newLog = {
          _id: new mongoose.Types.ObjectId().toString(),
          pillar,
          reviewer,
          priorityScore,
          telemetryData: telemetryData || {},
          submittedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        db.logs.unshift(newLog);
        writeLocalDb(db);
        return res.status(201).json({
          message: 'Facility log stored successfully in lightweight datastore',
          data: newLog
        });
      }

      const newLog = new FacilityLog({
        pillar,
        reviewer,
        priorityScore,
        telemetryData: telemetryData || {}
      });

      await newLog.save();
      res.status(201).json({
        message: 'Facility log stored successfully',
        data: newLog
      });
    } catch (err: any) {
      console.error('Error creating facility log:', err.message);
      res.status(500).json({ message: 'Failed to write facility log' });
    }
  });

  // 4. Retrieve All Logs (Protected with JWT authorization)
  app.get('/api/logs', authMiddleware, async (req: any, res: express.Response): Promise<any> => {
    try {
      if (useLocalFallback) {
        const db = readLocalDb();
        const sortedLogs = [...db.logs].sort((a: any, b: any) => {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        });
        return res.json(sortedLogs);
      }

      const logs = await FacilityLog.find().sort({ submittedAt: -1 });
      res.json(logs);
    } catch (err: any) {
      console.error('Error fetching facility logs:', err.message);
      res.status(500).json({ message: 'Failed to retrieve exception logs' });
    }
  });

  // 5. Root Healthcheck Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      database: useLocalFallback ? 'local_fallback_active' : (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'),
      mongodbState: mongoose.connection.readyState
    });
  });

  return { app, requireRole };
}
