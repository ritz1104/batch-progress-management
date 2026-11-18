const { isMongoConnected, memoryStore, saveLocalStore } = require('../config/db');
const {
  UserModel,
  BatchModel,
  DailyProgressModel,
  AttendanceModel,
  ActivityEventModel,
  InviteModel
} = require('./schemas');

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function matchQuery(item, query = {}) {
  for (const [key, val] of Object.entries(query)) {
    if (val === undefined) continue;
    if (key === '_id' || key === 'id') {
      if (String(item._id) !== String(val)) return false;
    } else if (typeof val === 'object' && val !== null) {
      if (val.$in && Array.isArray(val.$in)) {
        if (!val.$in.includes(item[key])) return false;
      }
    } else {
      if (item[key] !== val) return false;
    }
  }
  return true;
}

function createDAO(collectionName, MongooseModel) {
  if (!memoryStore[collectionName]) {
    memoryStore[collectionName] = [];
  }

  return {
    async find(query = {}) {
      if (isMongoConnected()) {
        return await MongooseModel.find(query).lean();
      }
      return (memoryStore[collectionName] || []).filter(item => matchQuery(item, query));
    },

    async findOne(query = {}) {
      if (isMongoConnected()) {
        return await MongooseModel.findOne(query).lean();
      }
      return (memoryStore[collectionName] || []).find(item => matchQuery(item, query)) || null;
    },

    async findById(id) {
      if (isMongoConnected()) {
        return await MongooseModel.findById(id).lean();
      }
      return (memoryStore[collectionName] || []).find(item => String(item._id) === String(id)) || null;
    },

    async create(doc) {
      if (isMongoConnected()) {
        const created = await MongooseModel.create(doc);
        return created.toObject ? created.toObject() : created;
      }
      const newDoc = {
        _id: generateId(),
        ...doc,
        createdAt: doc.createdAt || new Date().toISOString()
      };
      if (!memoryStore[collectionName]) memoryStore[collectionName] = [];
      memoryStore[collectionName].push(newDoc);
      saveLocalStore();
      return newDoc;
    },

    async findByIdAndUpdate(id, updateData, options = { new: true }) {
      if (isMongoConnected()) {
        return await MongooseModel.findByIdAndUpdate(id, updateData, options).lean();
      }
      const list = memoryStore[collectionName] || [];
      const index = list.findIndex(item => String(item._id) === String(id));
      if (index === -1) return null;
      list[index] = {
        ...list[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      saveLocalStore();
      return list[index];
    },

    async updateOne(query, updateData) {
      if (isMongoConnected()) {
        return await MongooseModel.updateOne(query, updateData);
      }
      const list = memoryStore[collectionName] || [];
      const index = list.findIndex(item => matchQuery(item, query));
      if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
      list[index] = {
        ...list[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      saveLocalStore();
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async findByIdAndDelete(id) {
      if (isMongoConnected()) {
        return await MongooseModel.findByIdAndDelete(id).lean();
      }
      const list = memoryStore[collectionName] || [];
      const index = list.findIndex(item => String(item._id) === String(id));
      if (index === -1) return null;
      const [removed] = list.splice(index, 1);
      saveLocalStore();
      return removed;
    },

    async deleteMany(query = {}) {
      if (isMongoConnected()) {
        return await MongooseModel.deleteMany(query);
      }
      const list = memoryStore[collectionName] || [];
      const initialLen = list.length;
      memoryStore[collectionName] = list.filter(item => !matchQuery(item, query));
      saveLocalStore();
      return { deletedCount: initialLen - memoryStore[collectionName].length };
    },

    async countDocuments(query = {}) {
      if (isMongoConnected()) {
        return await MongooseModel.countDocuments(query);
      }
      return (memoryStore[collectionName] || []).filter(item => matchQuery(item, query)).length;
    }
  };
}

module.exports = {
  UserDAO: createDAO('users', UserModel),
  BatchDAO: createDAO('batches', BatchModel),
  DailyProgressDAO: createDAO('dailyprogresses', DailyProgressModel),
  AttendanceDAO: createDAO('attendances', AttendanceModel),
  ActivityEventDAO: createDAO('activityevents', ActivityEventModel),
  InviteDAO: createDAO('invites', InviteModel),
  UserModel,
  BatchModel,
  DailyProgressModel,
  AttendanceModel,
  ActivityEventModel,
  InviteModel
};
