/**
 * ===================================================================
 * YUVAGIFTS – EXPRESS API & APPLICATION SERVER (server.js)
 * ===================================================================
 * Central backend server powering the storefront and administrative portal.
 * Features:
 *  - Public REST API for store visitors to browse & search products
 *  - Administrative CRUD endpoints to add, modify, and delete products
 *  - File upload engine (Multer) for product images
 *  - Static file hosting for HTML, CSS, JavaScript, and uploaded assets
 * ===================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `prod_${Date.now()}_${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg/i;
    const isMime = allowed.test(file.mimetype);
    const isExt = allowed.test(path.extname(file.originalname));
    if (isMime && isExt) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, SVG) are allowed!'));
    }
  }
});

// Robust CORS headers to allow local file:// (Origin: null), Live Server, and any port
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Serve static assets and uploads
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname));

// Friendly Page Routing – connects all routes seamlessly to unified single page app
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/home', (req, res) => res.redirect('/#home'));
app.get('/products', (req, res) => res.redirect('/#catalog'));
app.get('/catalog', (req, res) => res.redirect('/#catalog'));
app.get('/about', (req, res) => res.redirect('/#about'));
app.get('/contact', (req, res) => res.redirect('/#contact'));
app.get('/login', (req, res) => res.redirect('/'));
app.get('/admin', (req, res) => res.redirect('/#admin'));
app.get('/admin-dashboard', (req, res) => res.redirect('/#admin'));
app.get('/admin-login', (req, res) => res.redirect('/#admin'));



// ===================================================================
// PUBLIC PRODUCT ROUTES (ACCESSIBLE TO ALL STOREFRONT USERS)
// ===================================================================

/**
 * GET /api/products
 * Fetch all products or filter by category & query
 */
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    const products = await db.getAll({ category, search });
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve products from database.' });
  }
});

/**
 * GET /api/products/:id
 * Fetch single product details by ID
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    console.error('Error fetching product by id:', err);
    res.status(500).json({ success: false, error: 'Database query failed.' });
  }
});

/**
 * GET /api/stats
 * Catalog and inventory stats
 */
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to compute catalog statistics.' });
  }
});

// ===================================================================
// ADMIN MANAGEMENT ROUTES (ADD, EDIT, DELETE PRODUCTS)
// ===================================================================

/**
 * POST /api/products
 * Admin creates and adds a new product to the database
 */
app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, error: 'Product name and price are required.' });
    }

    const ua = req.headers['user-agent'] || 'unknown';
    const referer = req.headers['referer'] || req.headers['origin'] || 'direct';
    console.log(`[API POST /api/products] Request from: ${referer} (UA: ${ua.slice(0, 40)}...) for "${name}"`);

    const created = await db.create(req.body);
    console.log(`[Database] Admin added product #${created.id} - "${created.name}"`);
    res.status(201).json({
      success: true,
      message: `Product "${created.name}" successfully created in database.`,
      data: created
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ success: false, error: 'Failed to insert product into database.' });
  }
});

/**
 * PUT /api/products/:id
 * Admin updates any details of an existing product
 */
app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await db.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found in database.' });
    }
    console.log(`[Database] Admin updated product #${updated.id} - "${updated.name}"`);
    res.json({
      success: true,
      message: `Product #${updated.id} updated successfully.`,
      data: updated
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, error: 'Failed to update product in database.' });
  }
});

/**
 * DELETE /api/products/:id
 * Admin deletes a product from the database
 */
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deleted = await db.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    console.log(`[Database] Admin deleted product #${deleted.id} - "${deleted.name}"`);
    res.json({
      success: true,
      message: `Product #${deleted.id} ("${deleted.name}") removed from database.`,
      data: deleted
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, error: 'Failed to delete product from database.' });
  }
});

/**
 * POST /api/products/reset
 * Restore default catalog seed
 */
app.post('/api/products/reset', async (req, res) => {
  try {
    const list = await db.resetToDefault();
    res.json({ success: true, message: 'Database reset to default curated catalog.', count: list.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reset database.' });
  }
});

/**
 * POST /api/upload
 * Admin uploads high-resolution product image
 */
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }
    const relativeUrl = `/uploads/${req.file.filename}`;
    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.protocol || 'http';
    const fullUrl = `${protocol}://${host}${relativeUrl}`;
    res.json({
      success: true,
      message: 'Image uploaded successfully.',
      url: fullUrl,
      relativeUrl: relativeUrl,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message || 'Image upload failed.' });
  }
});

/**
 * POST /api/auth/admin-login
 * Administrator credential verification
 */
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Admin authentication successful.',
      token: 'yg_adm_' + Date.now()
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials.'
    });
  }
});

/**
 * POST /api/inquiries
 * Customer submits contact / concierge inquiry into database
 */
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email, and message are required.' });
    }
    const created = await db.createInquiry(req.body);
    console.log(`[Database] Stored new client inquiry #${created.id} from "${created.name}"`);
    res.status(201).json({
      success: true,
      message: 'Inquiry received and logged to database.',
      data: created
    });
  } catch (err) {
    console.error('Error logging inquiry:', err);
    res.status(500).json({ success: false, error: 'Failed to record inquiry in database.' });
  }
});

/**
 * GET /api/inquiries
 * Retrieve client inquiries from database
 */
app.get('/api/inquiries', async (req, res) => {
  try {
    const inquiries = await db.getAllInquiries();
    res.json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch inquiries from database.' });
  }
});

// Fallback to index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening
const server = app.listen(PORT, async () => {
  const stats = await db.getStats();
  console.log('\n======================================================');
  console.log('       🎁 YUVAGIFTS STOREFRONT & DATABASE SERVER      ');
  console.log('======================================================');
  console.log(` • Server running on:  http://localhost:${PORT}`);
  console.log(` • Database Engine:    ${stats.engine}`);
  console.log(` • Total Live Items:   ${stats.totalProducts}`);
  console.log(` • Customer Catalog:   http://localhost:${PORT}/products.html`);
  console.log(` • Admin Portal:       http://localhost:${PORT}/admin-dashboard.html`);
  console.log(` • Database API:       http://localhost:${PORT}/api/products`);
  console.log('======================================================\n');
});

module.exports = { app, server };
