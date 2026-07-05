const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const FacilityLog = require('./models/FacilityLog');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// MongoDB connection with graceful connection handling
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/facility_management';

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB successfully connected.');
    seedAdminUser();
  })
  .catch(err => {
    console.error('MongoDB connection failed. Please ensure MongoDB is running or configure MONGODB_URI.', err.message);
  });

// Seed default administrator if not present
async function seedAdminUser() {
  try {
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'Master Admin'
      });
      await newAdmin.save();
      console.log('Successfully seeded default administrator user: USERNAME="admin", PASSWORD="admin123"');
    } else {
      console.log('Administrator user "admin" already exists.');
    }
  } catch (error) {
    console.error('Failed to seed default administrator user:', error.message);
  }
}

// REST APIs

// 1. Auth Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Please provide username and password' });
  }

  try {
    // Find the master user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare encrypted passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate Bearer JWT claims payload
    const payload = {
      id: user._id,
      username: user.username,
      role: user.role
    };

    const jwtSecret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });

    res.json({
      message: 'Authentication successful',
      token: `Bearer ${token}`,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error logging in admin:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. Submit Log Entry (Injected from user actions)
app.post('/api/logs', async (req, res) => {
  const { pillar, reviewer, priorityScore, telemetryData } = req.body;

  if (!pillar || !reviewer || priorityScore === undefined) {
    return res.status(400).json({ message: 'Pillar, Reviewer, and Priority Score are required fields' });
  }

  try {
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
  } catch (err) {
    console.error('Error creating facility log:', err.message);
    res.status(500).json({ message: 'Failed to write facility log' });
  }
});

// 3. Retrieve All Logs (Protected with JWT authorization)
app.get('/api/logs', auth, async (req, res) => {
  try {
    const logs = await FacilityLog.find().sort({ submittedAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching facility logs:', err.message);
    res.status(500).json({ message: 'Failed to retrieve exception logs' });
  }
});

// Root Healthcheck Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express custom server running on http://0.0.0.0:${PORT}`);
});
