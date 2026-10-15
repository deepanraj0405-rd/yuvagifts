# 🎁 Yuvagifts – Luxury Gift Boutique & Store Management Portal

Gift shop website with a dedicated central database, WhatsApp ordering, and a full-featured admin management portal where administrators can add, update, and delete products, and any user/customer can view the live catalog in real-time.

---

## 🗄️ Architecture & Database Structure

- **`models/Product.js`**: Mongoose Schema & Data Model for MongoDB.
- **`database.js`**: Enterprise database module powered by **MongoDB** via Mongoose with automatic data migration and resilient fallback.
  - Supports complete CRUD operations (`getAll`, `getById`, `create`, `update`, `delete`, `resetToDefault`, `getStats`).
  - Automatically migrates existing published gifts into MongoDB on connect.
  - Dual-mode resilience: keeps your live store running smoothly even when MongoDB is offline.
- **`.env`**: Configures `MONGODB_URI` (MongoDB Atlas Cloud or local `mongodb://localhost:27017/yuvagifts`) and server port.
- **`server.js`**: Express backend server connecting MongoDB with the storefront and admin dashboard.
- **`data/products.json`**: Redundant physical disk backup ensuring 100% uptime.
- **`uploads/`**: Directory storing administrator-uploaded product photos.

---

## 🚀 How to Run

### Option 1: Live Central Database Server (Recommended)
Run the server with Node.js:
```bash
npm start
# OR:
node server.js
```

Then open:
- **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
- **Product Catalog:** [http://localhost:3000/products.html](http://localhost:3000/products.html)
- **Admin Portal:** [http://localhost:3000/admin-login.html](http://localhost:3000/admin-login.html)
- **Database API:** [http://localhost:3000/api/products](http://localhost:3000/api/products)

### Option 2: Standalone Static Mode
You can also open `index.html` directly in any web browser. It will use local storage and offline cache automatically.

---

## 🛠️ Admin Management Capabilities

1. **Add New Products:** Admin fills in title, category, price, stock, description, inclusions, and photo (either by uploading a file or pasting a URL). Newly added products appear immediately in the database and on the customer storefront.
2. **Edit Existing Products:** Admin clicks "Edit" on any product, changes any fields (price, stock, title, description, discounts, etc.), and clicks "Save Changes to Database". All customers see the updated info immediately.
3. **Delete Products:** Admin clicks "Delete", confirms in the modal, and the product is removed from the central database.
4. **Photo Uploads:** Admin can upload photos directly from their computer or paste direct CDN links.
5. **Restore Catalog:** Admin can click "⚡ Reset Defaults" to restore the original 12 luxury gifts anytime.

---

## 🔑 Administrator Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/products` | Retrieve all products (supports `?category=` & `?search=`) | Public (Any User) |
| `GET` | `/api/products/:id` | Retrieve single product details | Public (Any User) |
| `GET` | `/api/stats` | Retrieve catalog & inventory statistics | Public |
| `POST` | `/api/products` | Add a new product to the database | Admin |
| `PUT` | `/api/products/:id` | Update any product field | Admin |
| `DELETE` | `/api/products/:id` | Delete product from database | Admin |
| `POST` | `/api/upload` | Upload product photograph | Admin |
| `POST` | `/api/products/reset` | Restore 12 default products | Admin |

---

## 📲 WhatsApp Orders
"Order on WhatsApp" opens a pre-filled cart inquiry to `+91 8637604442`. Configure `WHATSAPP_NUMBER` in `js/main.js`.
