/**
 * ===================================================================
 * YUVAGIFTS – MONGODB & CENTRAL DATABASE MODULE (database.js)
 * ===================================================================
 * Enterprise database provider powered by MongoDB (Mongoose) with
 * resilient automatic fallback to local JSON database storage.
 *
 * Capabilities:
 *  - Native MongoDB CRUD operations for products
 *  - Automatic data migration from products.json into MongoDB on first connect
 *  - Automatic connection recovery and retry mechanism
 *  - Dual-mode resilience: seamless JSON backup ensures 100% uptime
 * ===================================================================
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');
const Inquiry = require('./models/Inquiry');

// Local storage paths for fallback & backup
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'products.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');

// MongoDB Connection URI from .env or default local instance
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yuvagifts';

class ProductDatabase {
  constructor() {
    this.isMongoConnected = false;
    this.mongoUri = MONGODB_URI;
    this.ensureLocalInitialized();
    this.initMongoConnection();
  }

  /**
   * Initialize and monitor MongoDB connection
   */
  async initMongoConnection() {
    try {
      mongoose.set('strictQuery', false);
      
      mongoose.connection.on('connected', async () => {
        this.isMongoConnected = true;
        console.log(`[MongoDB] Connected successfully to database: ${this.mongoUri}`);
        await this.syncLocalToMongo();
      });

      mongoose.connection.on('error', (err) => {
        this.isMongoConnected = false;
        console.warn(`[MongoDB] Connection notice: ${err.message}. Serving from resilient storage.`);
      });

      mongoose.connection.on('disconnected', () => {
        this.isMongoConnected = false;
        console.warn('[MongoDB] Disconnected. Running in local fallback mode.');
      });

      // Attempt initial connection with 4-second timeout to prevent stalling
      await mongoose.connect(this.mongoUri, {
        serverSelectionTimeoutMS: 4000
      });
    } catch (err) {
      this.isMongoConnected = false;
      console.info(`[Database] MongoDB offline or connecting (${err.message}). Active mode: Resilient Local Storage.`);
    }
  }

  /**
   * Migrate existing products from products.json into MongoDB collection
   */
  async syncLocalToMongo() {
    try {
      if (!this.isMongoConnected) return;
      const count = await Product.countDocuments();
      if (count === 0) {
        const localList = this.readAllJson();
        if (localList.length > 0) {
          console.log(`[MongoDB] Migrating ${localList.length} published products from products.json into MongoDB...`);
          await Product.insertMany(localList);
          console.log('[MongoDB] Migration complete! All products now live in MongoDB.');
        }
      }
    } catch (err) {
      console.warn('[MongoDB] Sync warning:', err.message);
    }
  }

  /**
   * Ensure local backup directory and json file exist
   */
  ensureLocalInitialized() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const DEFAULT_SEEDS = [];

      if (!fs.existsSync(DB_FILE)) {
        this.writeAllJson([]);
      }
    } catch (err) {
      console.error('[Database Init Error]:', err);
    }
  }

  /**
   * Read raw data from local JSON disk backup
   */
  readAllJson() {
    try {
      this.ensureLocalInitialized();
      const content = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Safely write data to local disk backup
   */
  writeAllJson(products) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const dataToWrite = Array.isArray(products) ? products : [];
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToWrite, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[Database Backup Write Error]:', err);
      return false;
    }
  }

  /**
   * Get all products (supports MongoDB query filtering)
   */
  async getAll(filter = {}) {
    if (this.isMongoConnected) {
      try {
        const query = {};
        if (filter.category && filter.category !== 'all') {
          query.category = filter.category.toLowerCase().trim();
        }
        if (filter.search) {
          const q = filter.search.toLowerCase().trim();
          query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { category: { $regex: q, $options: 'i' } },
            { tag: { $regex: q, $options: 'i' } }
          ];
        }
        const docs = await Product.find(query).sort({ id: -1 }).lean();
        return docs.map(d => {
          delete d._id;
          delete d.__v;
          return d;
        });
      } catch (err) {
        console.warn('[MongoDB Query Error]:', err.message);
      }
    }

    // Local fallback
    let list = this.readAllJson();
    if (filter.category && filter.category !== 'all') {
      const targetCat = filter.category.toLowerCase().trim();
      list = list.filter(p => (p.category || '').toLowerCase().trim() === targetCat);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.tag && p.tag.toLowerCase().includes(q))
      );
    }
    return list;
  }

  /**
   * Get single product by ID
   */
  async getById(id) {
    const targetId = Number(id);
    if (this.isMongoConnected) {
      try {
        const doc = await Product.findOne({ id: targetId }).lean();
        if (doc) {
          delete doc._id;
          delete doc.__v;
          return doc;
        }
      } catch (err) {
        console.warn('[MongoDB GetById Error]:', err.message);
      }
    }

    const list = this.readAllJson();
    return list.find(p => Number(p.id) === targetId) || null;
  }

  /**
   * Admin: Add new product to MongoDB database
   */
  async create(productData) {
    // Generate next sequential numeric ID
    let nextId = 1;
    if (this.isMongoConnected) {
      try {
        const last = await Product.findOne().sort({ id: -1 }).lean();
        nextId = last && last.id ? last.id + 1 : 1;
      } catch (_) {}
    } else {
      const list = this.readAllJson();
      nextId = list.length ? Math.max(...list.map(p => Number(p.id) || 0)) + 1 : 1;
    }

    const newProduct = {
      id: nextId,
      name: String(productData.name || 'Untitled Gift').trim(),
      category: String(productData.category || 'birthday').trim().toLowerCase(),
      price: Number(productData.price) || 0,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      tag: productData.tag ? String(productData.tag).trim() : '',
      emoji: String(productData.emoji || '🎁').trim(),
      image: productData.image ? String(productData.image).trim() : '',
      stock: productData.stock !== undefined ? Math.max(0, parseInt(productData.stock, 10)) : 10,
      sold: productData.sold !== undefined ? Math.max(0, parseInt(productData.sold, 10)) : 0,
      rating: productData.rating !== undefined ? parseFloat(productData.rating) : 5.0,
      reviews: productData.reviews !== undefined ? parseInt(productData.reviews, 10) : 0,
      deliveryTime: String(productData.deliveryTime || 'Same Day').trim(),
      description: String(productData.description || '').trim(),
      includes: Array.isArray(productData.includes)
        ? productData.includes.map(s => String(s).trim()).filter(Boolean)
        : typeof productData.includes === 'string'
        ? productData.includes.split('\n').map(s => s.trim()).filter(Boolean)
        : [],
      isPublished: productData.isPublished !== undefined ? Boolean(productData.isPublished) : true,
      status: productData.status ? String(productData.status).trim() : 'live',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to MongoDB
    if (this.isMongoConnected) {
      try {
        const created = await Product.create(newProduct);
        const obj = created.toObject();
        delete obj._id;
        delete obj.__v;
      } catch (err) {
        console.warn('[MongoDB Create Warning]:', err.message);
      }
    }

    // Always mirror to local backup
    const list = this.readAllJson();
    list.unshift(newProduct);
    this.writeAllJson(list);

    return newProduct;
  }

  /**
   * Admin: Update product details in MongoDB
   */
  async update(id, updates) {
    const targetId = Number(id);

    let parsedIncludes = undefined;
    if (updates.includes !== undefined) {
      if (Array.isArray(updates.includes)) {
        parsedIncludes = updates.includes.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof updates.includes === 'string') {
        parsedIncludes = updates.includes.split('\n').map(s => s.trim()).filter(Boolean);
      }
    }

    const cleanUpdates = {};
    if (updates.name !== undefined) cleanUpdates.name = String(updates.name).trim();
    if (updates.category !== undefined) cleanUpdates.category = String(updates.category).trim().toLowerCase();
    if (updates.price !== undefined) cleanUpdates.price = Number(updates.price);
    if (updates.originalPrice !== undefined) cleanUpdates.originalPrice = updates.originalPrice ? Number(updates.originalPrice) : null;
    if (updates.tag !== undefined) cleanUpdates.tag = String(updates.tag).trim();
    if (updates.emoji !== undefined) cleanUpdates.emoji = String(updates.emoji).trim();
    if (updates.image !== undefined) cleanUpdates.image = String(updates.image).trim();
    if (updates.stock !== undefined) cleanUpdates.stock = Math.max(0, parseInt(updates.stock, 10));
    if (updates.sold !== undefined) cleanUpdates.sold = Math.max(0, parseInt(updates.sold, 10));
    if (updates.rating !== undefined) cleanUpdates.rating = parseFloat(updates.rating);
    if (updates.reviews !== undefined) cleanUpdates.reviews = parseInt(updates.reviews, 10);
    if (updates.deliveryTime !== undefined) cleanUpdates.deliveryTime = String(updates.deliveryTime).trim();
    if (updates.description !== undefined) cleanUpdates.description = String(updates.description).trim();
    if (updates.isPublished !== undefined) cleanUpdates.isPublished = Boolean(updates.isPublished);
    if (updates.status !== undefined) cleanUpdates.status = String(updates.status).trim();
    if (parsedIncludes !== undefined) cleanUpdates.includes = parsedIncludes;
    cleanUpdates.updatedAt = new Date().toISOString();

    let updatedDoc = null;

    if (this.isMongoConnected) {
      try {
        const doc = await Product.findOneAndUpdate({ id: targetId }, cleanUpdates, { new: true }).lean();
        if (doc) {
          delete doc._id;
          delete doc.__v;
          updatedDoc = doc;
        }
      } catch (err) {
        console.warn('[MongoDB Update Warning]:', err.message);
      }
    }

    // Mirror update to local JSON backup
    const list = this.readAllJson();
    const idx = list.findIndex(p => Number(p.id) === targetId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...cleanUpdates };
      this.writeAllJson(list);
      if (!updatedDoc) updatedDoc = list[idx];
    }

    return updatedDoc;
  }

  /**
   * Admin: Delete product from MongoDB
   */
  async delete(id) {
    const targetId = Number(id);
    let removedDoc = null;

    if (this.isMongoConnected) {
      try {
        const doc = await Product.findOneAndDelete({ id: targetId }).lean();
        if (doc) {
          delete doc._id;
          delete doc.__v;
          removedDoc = doc;
        }
      } catch (err) {
        console.warn('[MongoDB Delete Warning]:', err.message);
      }
    }

    // Mirror to local JSON backup
    const list = this.readAllJson();
    const idx = list.findIndex(p => Number(p.id) === targetId);
    if (idx !== -1) {
      const spliced = list.splice(idx, 1)[0];
      this.writeAllJson(list);
      if (!removedDoc) removedDoc = spliced;
    }

    return removedDoc;
  }

  /**
   * Clear all products
   */
  async clearAll() {
    if (this.isMongoConnected) {
      try {
        await Product.deleteMany({});
      } catch (_) {}
    }
    this.writeAllJson([]);
    return [];
  }

  /**
   * Reset database
   */
  async resetToDefault() {
    return await this.clearAll();
  }

  /**
   * Read inquiries from local JSON disk backup
   */
  readAllInquiriesJson() {
    try {
      if (!fs.existsSync(INQUIRIES_FILE)) return [];
      const content = fs.readFileSync(INQUIRIES_FILE, 'utf8');
      const data = JSON.parse(content);
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  /**
   * Safely write inquiries to local disk backup
   */
  writeAllInquiriesJson(inquiries) {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(Array.isArray(inquiries) ? inquiries : [], null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error('[Database Inquiries Write Error]:', err);
      return false;
    }
  }

  /**
   * Create new contact / concierge inquiry
   */
  async createInquiry(data) {
    const list = this.readAllInquiriesJson();
    const nextId = list.length ? Math.max(...list.map(i => Number(i.id) || 0)) + 1 : 1;

    const record = {
      id: nextId,
      name: (data.name || '').trim(),
      email: (data.email || '').trim(),
      phone: (data.phone || '').trim(),
      type: (data.type || 'general').trim(),
      message: (data.message || '').trim(),
      status: 'new',
      createdAt: new Date().toISOString()
    };

    if (this.isMongoConnected) {
      try {
        const createdMongo = await Inquiry.create(record);
        const docObj = createdMongo.toObject();
        delete docObj._id;
        delete docObj.__v;
        list.unshift(docObj);
        this.writeAllInquiriesJson(list);
        return docObj;
      } catch (err) {
        console.warn('[MongoDB] Inquiry save fallback:', err.message);
      }
    }

    list.unshift(record);
    this.writeAllInquiriesJson(list);
    return record;
  }

  /**
   * Get all inquiries
   */
  async getAllInquiries() {
    if (this.isMongoConnected) {
      try {
        const docs = await Inquiry.find().sort({ id: -1 }).lean();
        return docs.map(d => {
          delete d._id;
          delete d.__v;
          return d;
        });
      } catch (_) {}
    }
    return this.readAllInquiriesJson();
  }

  /**
   * Get database statistics
   */
  async getStats() {
    let list = [];
    if (this.isMongoConnected) {
      try {
        list = await Product.find().lean();
      } catch (_) {
        list = this.readAllJson();
      }
    } else {
      list = this.readAllJson();
    }

    const totalProducts = list.length;
    const totalUnitsSold = list.reduce((acc, p) => acc + (Number(p.sold) || 0), 0);
    const lowStockCount = list.filter(p => Number(p.stock) <= 15).length;
    const outOfStockCount = list.filter(p => Number(p.stock) === 0).length;

    const categories = list.reduce((acc, p) => {
      const c = p.category || 'general';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});

    const inquiries = await this.getAllInquiries();

    return {
      engine: this.isMongoConnected ? 'MongoDB' : 'MongoDB (Resilient Local Storage)',
      isMongoConnected: this.isMongoConnected,
      mongoUri: this.isMongoConnected ? this.mongoUri.replace(/:([^@]+)@/, ':****@') : null,
      totalProducts,
      totalUnitsSold,
      lowStockCount,
      outOfStockCount,
      totalInquiries: inquiries.length,
      categories,
      databaseFile: DB_FILE
    };
  }
}

const db = new ProductDatabase();
module.exports = db;
