const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnected = false;
const DATA_FILE = path.join(__dirname, '../../data/store.json');

// In-memory + JSON file backup store for zero-config fallback
let memoryStore = {
  users: [],
  batches: [],
  students: [],
  dailyprogresses: [],
  attendances: [],
  activityevents: [],
  invites: []
};

function loadLocalStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      memoryStore = JSON.parse(content);
    } else {
      saveLocalStore();
    }
  } catch (err) {
    console.error('[DB-Fallback] Error loading local store:', err.message);
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB-Fallback] Error saving local store:', err.message);
  }
}

loadLocalStore();

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/batch_progress';
  try {
    console.log(`[DB] Attempting MongoDB connection to ${uri}...`);
    // Connect with a 1.2 second timeout so local mode fallback is instantaneous if mongod is not running
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1200,
    });
    isConnected = true;
    console.log('✅ [DB] MongoDB Connected successfully!');
  } catch (err) {
    isConnected = false;
    console.warn(`⚠️ [DB] MongoDB not detected (${err.message}).`);
    console.log('📦 [DB] Operating in Resilient Local Storage mode (backend/data/store.json).');
    console.log('💡 [DB] To use MongoDB Atlas or local MongoDB, set MONGODB_URI in backend/.env');
  }
}

function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  isMongoConnected,
  memoryStore,
  saveLocalStore
};
