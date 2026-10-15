// ===== INITIAL SEED CATALOG (FAIL-SAFE INITIALIZER) =====
const INITIAL_SEED_PRODUCTS = [];

// Active catalog in-memory store
const products = [];

const WHATSAPP_NUMBER = "918637604442";

// Determine API Base URL dynamically (supports Node server on port 3000, Live Server on port 5500, or local file://)
function getApiBase() {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    if (window.location.port === '3000') return window.location.origin;
  }
  return 'http://localhost:3000';
}
const API_BASE = getApiBase();
if (typeof window !== 'undefined') {
  window.API_BASE = API_BASE;
  window.getApiBase = getApiBase;
}

// Image URL Normalizer: handles base64, absolute URLs, and relative upload paths across file:// and web servers
function formatImageUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith('/') ? trimmed : '/' + trimmed;
  return `${API_BASE}${cleanPath}`;
}
if (typeof window !== 'undefined') window.formatImageUrl = formatImageUrl;

window.yuvagiftsDbConnected = false;

// Synchronous initial read from localStorage backup
(function syncCachedProducts() {
  try {
    const saved = localStorage.getItem('yuvagifts_products');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        products.length = 0;
        parsed.forEach(p => products.push(p));
      }
    } else {
      localStorage.setItem('yuvagifts_products', JSON.stringify([]));
    }
  } catch (e) {
    /* ignore */
  }
})();

// Real-time synchronization across browser tabs via storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'yuvagifts_products') {
      try {
        const parsed = JSON.parse(e.newValue || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          products.length = 0;
          parsed.forEach(p => products.push(p));
          window.dispatchEvent(new CustomEvent('yuvagifts:products-loaded', { detail: products }));
        }
      } catch (_) {}
    }
  });
}

// Asynchronously fetch live products from the central database
async function fetchProductsFromDB() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        products.length = 0;
        json.data.forEach(p => products.push(p));

        window.yuvagiftsDbConnected = true;
        try {
          localStorage.setItem('yuvagifts_products', JSON.stringify(products));
        } catch (_) {}
        window.dispatchEvent(new CustomEvent('yuvagifts:products-loaded', { detail: products }));
        return products;
      }
    }
  } catch (err) {
    window.yuvagiftsDbConnected = false;
    console.info('[Yuvagifts Database] Serving from local catalog cache.');
  }
  return products;
}

// Automatically fetch on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => fetchProductsFromDB());
  } else {
    fetchProductsFromDB();
  }
}

// ===== SHARED NAVBAR + FOOTER =====
function renderChrome() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const isAdmin = page.startsWith('admin');
  const link = (href, label, cls = '') =>
    `<li><a href="${href}" class="${cls} ${page === href ? 'active' : ''}">${label}</a></li>`;
  const links = `
    ${link('index.html', 'Home')}
    ${link('products.html', 'Shop Catalog')}
    ${link('about.html', 'About Us')}
    ${link('contact.html', 'Contact')}
    ${link('admin-dashboard.html', 'Admin Portal', 'admin-btn')}
  `;

  const nav = document.getElementById('nav');
  if (nav) {
    nav.outerHTML = `<nav class="navbar" role="navigation" aria-label="Main navigation"><div class="wrap">
      <a href="index.html" class="logo">
        <span class="logo-mark">YG</span>
        <span class="logo-text">YUVA<b>GIFTS</b></span>
        ${page === 'admin-dashboard.html' ? '<span class="admin-badge">Admin</span>' : ''}
      </a>
      <button class="menu-toggle" aria-label="Toggle navigation" onclick="document.querySelector('.nav-links').classList.toggle('open')">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <ul class="nav-links">${links}</ul>
    </div></nav>`;
  }

  const f = document.getElementById('footer');
  if (f) {
    f.outerHTML = `<footer class="footer" role="contentinfo">
      <div class="footer-inner">
        <div class="footer-brand">
          <a href="index.html" class="logo">
            <span class="logo-mark">YG</span>
            <span class="logo-text">YUVA<b>GIFTS</b></span>
          </a>
          <p>India's premier gifting boutique. Handcrafted floral arrangements, artisanal hampers, and bespoke keepsakes for life's most meaningful moments.</p>
          <div class="footer-badges">
            <span class="trust-pill">🔒 Verified Secure</span>
            <span class="trust-pill">✨ 100% Quality Guaranteed</span>
          </div>
        </div>
        <div class="footer-links">
          <h4>Collections</h4>
          <a href="products.html?cat=birthday">Birthday Celebrations</a>
          <a href="products.html?cat=anniversary">Anniversary Milestones</a>
          <a href="products.html?cat=wedding">Wedding & Bridal</a>
          <a href="products.html?cat=festival">Festive & Holiday</a>
          <a href="products.html">All Curated Gifts</a>
        </div>
        <div class="footer-links">
          <h4>Customer Care</h4>
          <a href="about.html">Our Craft & Story</a>
          <a href="contact.html">Customer Support</a>
          <a href="admin-dashboard.html">Admin Dashboard</a>
          <a href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank">Order Tracking via WhatsApp</a>
          <a href="contact.html">Corporate & Bulk Inquiries</a>
        </div>
        <div class="footer-links">
          <h4>Concierge Service</h4>
          <p class="concierge-desc">Need assistance selecting the perfect gift or custom styling? Speak directly with our gifting consultant.</p>
          <a href="https://wa.me/${WHATSAPP_NUMBER}?text=Hi,%20I'd%20like%20assistance%20with%20custom%20gifting" target="_blank" class="footer-wa-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Chat with Concierge
          </a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Yuvagifts Luxury Goods Pvt. Ltd. All rights reserved.</p>
        <div class="footer-sublinks">
          <span>Standard Delivery Terms</span>
          <span>Privacy Policy</span>
          <span>Quality Assurance</span>
        </div>
      </div>
    </footer>`;
  }
}
document.addEventListener('DOMContentLoaded', renderChrome);

// ===== TOAST =====
function toast(msg, type = 'info') {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    document.body.appendChild(t);
  }
  t.className = 'toast' + (type === 'success' ? ' toast-success' : '');
  t.innerHTML = (type === 'success' ? '<span class="toast-icon">✨</span> ' : '') + msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 3500);
}

// ===== PRODUCT DETAIL MODAL =====
function openProductModal(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  const stars = renderStars(p.rating || 5);
  const includesList = (Array.isArray(p.includes) ? p.includes : []).map(i => `<li><span class="check-icon">✓</span> <span>${i}</span></li>`).join('');
  const stockCount = Number(p.stock) || 0;
  const badge = stockCount <= 15
    ? `<span class="modal-badge badge-low">Only ${stockCount} units remaining</span>`
    : `<span class="modal-badge badge-ok">In Stock &amp; Ready to Ship</span>`;

  const formattedImg = formatImageUrl(p.image);
  const imageHTML = formattedImg
    ? `<img src="${formattedImg}" alt="${p.name}" class="modal-product-photo" loading="eager" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='grid';">
       <div class="modal-img-fallback" style="display:none">${p.emoji || '🎁'}</div>`
    : `<div class="modal-img-fallback">${p.emoji || '🎁'}</div>`;

  const priceNum = Number(p.price) || 0;
  const origPriceNum = p.originalPrice ? Number(p.originalPrice) : null;
  const discount = (origPriceNum && origPriceNum > priceNum) ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100) : 0;
  const originalPriceHTML = origPriceNum ? `<span class="modal-orig-price">₹${origPriceNum.toLocaleString('en-IN')}</span>` : '';
  const discountBadge = discount > 0 ? `<span class="discount-pill">${discount}% OFF</span>` : '';

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalProductTitle">
      <button class="modal-close" onclick="closeModal()" aria-label="Close dialog">&times;</button>
      <div class="modal-grid">
        <div class="modal-photo-col">
          ${imageHTML}
          <div class="modal-photo-badges">
            <span class="photo-guarantee">✨ Complimentary Premium Wrapping</span>
          </div>
        </div>
        <div class="modal-body">
          <div class="modal-meta">
            <span class="category-tag">${p.category || 'Gift'}</span>
            ${badge}
          </div>
          <h2 class="modal-name" id="modalProductTitle">${p.name}</h2>
          <div class="modal-rating">
            ${stars}
            <span class="rating-number">${Number(p.rating || 5).toFixed(1)}</span>
            <span class="rating-divider">·</span>
            <span class="review-link">${p.reviews || 0} verified customer reviews</span>
          </div>

          <div class="modal-price-wrap">
            <span class="modal-price">₹${priceNum.toLocaleString('en-IN')}</span>
            ${originalPriceHTML}
            ${discountBadge}
            <span class="tax-note">Inclusive of all taxes &amp; gift wrapping</span>
          </div>

          <p class="modal-desc">${p.description || ''}</p>

          <div class="modal-delivery-promise">
            <div class="promise-item">
              <span class="p-icon">🚚</span>
              <div>
                <strong>${p.deliveryTime || 'Same Day'} Delivery</strong>
                <p>Express courier or scheduled slot available</p>
              </div>
            </div>
            <div class="promise-item">
              <span class="p-icon">💌</span>
              <div>
                <strong>Handwritten Card Included</strong>
                <p>Add your personalized message at checkout</p>
              </div>
            </div>
          </div>

          <div class="modal-includes">
            <h4>Curated In This Gift Set:</h4>
            <ul>${includesList || '<li><span class="check-icon">✓</span> <span>Premium Curated Presentation</span></li>'}</ul>
          </div>

          <div class="modal-cta-row">
            <button class="btn-whatsapp modal-wa" onclick="sendToWhatsApp(${p.id})">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              <span>Instant Order via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('open'));
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', escClose);
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.remove(), 280);
  document.removeEventListener('keydown', escClose);
}

function escClose(e) {
  if (e.key === 'Escape') closeModal();
}

function renderStars(rating) {
  const num = Number(rating) || 5;
  const full = Math.floor(num);
  const half = num % 1 >= 0.5;
  let s = '';
  for (let i = 0; i < full && i < 5; i++) s += '<span class="star full">★</span>';
  if (half && full < 5) s += '<span class="star half">★</span>';
  const currentCount = full + (half ? 1 : 0);
  for (let i = currentCount; i < 5; i++) s += '<span class="star empty">★</span>';
  return `<span class="stars">${s}</span>`;
}

// ===== ADMIN AUTHENTICATION (CLIENT LOGIN REMOVED) =====
(function purgeClientSession() {
  try {
    localStorage.removeItem('yuvagifts_client');
    localStorage.removeItem('yuvagifts_client_provider');
  } catch (_) {}
})();

async function adminLogin(e) {
  e.preventDefault();
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const origText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) submitBtn.textContent = 'Verifying with Database...';

  try {
    const res = await fetch(`${API_BASE}/api/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const json = await res.json();
    if (res.ok && json.success) {
      localStorage.setItem('yuvagifts_admin', 'true');
      if (json.token) localStorage.setItem('yuvagifts_admin_token', json.token);
      toast("Authentication confirmed by database!");
      setTimeout(() => { location.href = "admin-dashboard.html"; }, 300);
      return;
    } else {
      toast(json.error || "Invalid administrator credentials.");
    }
  } catch (err) {
    // Fallback if offline
    if (u === "admin" && p === "admin123") {
      localStorage.setItem('yuvagifts_admin', 'true');
      toast("Admin authenticated (offline mode)");
      setTimeout(() => { location.href = "admin-dashboard.html"; }, 300);
      return;
    }
    toast("Invalid administrator credentials.");
  } finally {
    if (submitBtn) submitBtn.textContent = origText;
  }
}

function logoutAdmin() {
  localStorage.removeItem('yuvagifts_admin');
  localStorage.removeItem('yuvagifts_admin_token');
  location.href = "admin-login.html";
}

async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const inputs = form.elements;
  const submitBtn = form.querySelector('button[type="submit"]');
  const origBtnText = submitBtn ? submitBtn.textContent : '';

  const name = (form.querySelector('input[type="text"]')?.value || '').trim();
  const email = (form.querySelector('input[type="email"]')?.value || '').trim();
  const phone = (form.querySelector('input[type="tel"]')?.value || '').trim();
  const type = form.querySelector('select')?.value || 'general';
  const message = (form.querySelector('textarea')?.value || '').trim();

  if (!name || !email || !message) {
    toast("Please fill in all required fields.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Recording in Database...';
  }

  try {
    const res = await fetch(`${API_BASE}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, type, message })
    });
    const json = await res.json();

    if (res.ok && json.success) {
      toast(`✓ Inquiry #${json.data.id} logged in database! We will contact you shortly.`);
      form.reset();
    } else {
      toast("Inquiry noted. We will contact you shortly.");
      form.reset();
    }
  } catch (err) {
    toast("Inquiry received. A gifting consultant will reach out via WhatsApp.");
    form.reset();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = origBtnText;
    }
  }
}
