// ===== SALES DATA =====
const salesData = [];

// ===== HELPERS =====
const inr  = n  => '₹' + Number(n).toLocaleString('en-IN');
const $    = id => document.getElementById(id);
const STORE_KEY = 'yuvagifts_products';

// Central Database API base URL (safely references global API_BASE from main.js)
const adminApiUrl = (typeof window !== 'undefined' && window.API_BASE)
  ? window.API_BASE
  : (typeof API_BASE !== 'undefined' ? API_BASE : 'http://localhost:3000');

let isDbActive = false;

// ===== DATABASE STATUS BADGE =====
async function updateDbBadge() {
  const badge = $('dbStatusBadge');
  const text = $('dbStatusText');
  const fileBadge = $('dbFileBadge');
  if (!badge) return;

  try {
    const res = await fetch(`${adminApiUrl}/api/stats`);
    if (res.ok) {
      const json = await res.json();
      isDbActive = true;
      badge.className = 'db-status-pill connected';
      text.textContent = 'Central Database Live';
      if (fileBadge) {
        fileBadge.style.display = 'inline-block';
        fileBadge.textContent = '📁 data/products.json';
        fileBadge.title = json.data?.databaseFile || 'Stored in persistent database';
      }
      return;
    }
  } catch (err) {
    // offline
  }

  isDbActive = false;
  badge.className = 'db-status-pill offline';
  text.textContent = 'Local Cache Mode';
  if (fileBadge) fileBadge.style.display = 'none';
}

// ===== LOAD PRODUCTS (CENTRAL DATABASE WITH LOCAL STORAGE FALLBACK) =====
async function loadProducts() {
  try {
    const res = await fetch(`${adminApiUrl}/api/products`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        products.length = 0;
        json.data.forEach(p => products.push(p));
        localStorage.setItem(STORE_KEY, JSON.stringify(products));
        isDbActive = true;
        renderAdminTable();
        updateStats();
        updateDbBadge();
        return;
      }
    }
  } catch (err) {
    console.info('[Admin] Cannot connect to server API. Using local backup.', err.message);
  }

  // Fallback to local storage if API is not running
  const saved = localStorage.getItem(STORE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        products.length = 0;
        parsed.forEach(p => products.push(p));
      }
    } catch (e) { /* ignore */ }
  }

  renderAdminTable();
  updateStats();
  updateDbBadge();
}

function persistProductsLocally() {
  localStorage.setItem(STORE_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent('yuvagifts:products-loaded', { detail: products }));
}

function nextId() {
  return products.length ? Math.max(...products.map(p => Number(p.id) || 0)) + 1 : 1;
}

// ===== STATS =====
function updateStats() {
  if ($('totalProducts')) $('totalProducts').textContent = products.length;
  if ($('totalSales'))    $('totalSales').textContent    = salesData.length;
  if ($('productsSold'))  $('productsSold').textContent  = products.reduce((s, p) => s + (Number(p.sold) || 0), 0);
  if ($('totalRevenue'))  $('totalRevenue').textContent  = inr(salesData.reduce((s, x) => s + x.amount, 0));
}

// ===== IMAGE PREVIEW & FILE UPLOAD =====
function updatePhotoPreview() {
  const raw = ($('fImage')?.value || '').trim();
  const url = typeof formatImageUrl === 'function' ? formatImageUrl(raw) : raw;
  const previewImg = $('previewImg');
  const placeholder = $('previewEmojiPlaceholder');
  if (!previewImg || !placeholder) return;

  if (url) {
    previewImg.src = url;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
    previewImg.onerror = () => {
      previewImg.style.display = 'none';
      placeholder.style.display = 'block';
      placeholder.textContent = $('fEmoji')?.value || '🎁';
    };
  } else {
    previewImg.style.display = 'none';
    placeholder.style.display = 'block';
    placeholder.textContent = $('fEmoji')?.value || '📷';
  }
}

async function handleImageFileUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const previewImg = $('previewImg');
  const placeholder = $('previewEmojiPlaceholder');

  // Immediately read as Base64 Data URL for instant preview and fail-safe local persistence
  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    if (previewImg && placeholder) {
      previewImg.src = dataUrl;
      previewImg.style.display = 'block';
      placeholder.style.display = 'none';
    }
    // Set immediate fallback so the product can be published immediately even if server is slow
    $('fImage').value = dataUrl;
  };
  reader.readAsDataURL(file);

  // Concurrently upload to server
  try {
    toast(`Uploading "${file.name}" to media server...`);
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${adminApiUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.url) {
        $('fImage').value = json.url;
        if (previewImg) previewImg.src = json.url;
        toast('Photo uploaded and linked successfully!');
        return;
      }
    }
    toast('Photo attached locally.');
  } catch (err) {
    console.warn('Image upload server error, using data URL:', err);
    toast('Photo attached directly to product.');
  }
}

// ===== ADMIN TABLE =====
function renderAdminTable() {
  const q = ($('adminSearch')?.value || '').toLowerCase().trim();
  const rows = products.filter(p => {
    if (!p) return false;
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const catMatch = (p.category || '').toLowerCase().includes(q);
    return nameMatch || catMatch;
  });
  
  const countBadge = $('inventoryCountBadge');
  if (countBadge) {
    countBadge.textContent = `${products.length} Product${products.length !== 1 ? 's' : ''} Live`;
  }

  const tableBody = $('productTable');
  if (!tableBody) return;

  tableBody.innerHTML = rows.length
    ? rows.map(p => {
        const priceNum = Number(p.price) || 0;
        const origPriceNum = p.originalPrice ? Number(p.originalPrice) : null;
        const imgUrl = typeof formatImageUrl === 'function' ? formatImageUrl(p.image) : (p.image || '');
        const thumbHTML = imgUrl
          ? `<img src="${imgUrl}" alt="" style="width:44px; height:44px; object-fit:cover; border-radius:6px; border:1px solid #e5e7eb" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline';"><span style="display:none; font-size:1.6rem">${p.emoji || '🎁'}</span>`
          : `<span style="font-size:1.6rem">${p.emoji || '🎁'}</span>`;

        const priceHTML = origPriceNum
          ? `<div><strong>${inr(priceNum)}</strong> <span style="font-size:0.75rem; text-decoration:line-through; color:#9ca3af">${inr(origPriceNum)}</span></div>`
          : `<strong>${inr(priceNum)}</strong>`;

        const stockNum = Number(p.stock) || 0;
        return `
        <tr id="row-${p.id}" class="${stockNum <= 15 ? 'low-stock-row' : ''}">
          <td><span class="row-id">#${p.id}</span></td>
          <td>${thumbHTML}</td>
          <td>
            <strong>${p.name || 'Untitled Gift'}</strong>
            ${p.tag ? `<br><span style="font-size:0.72rem; color:var(--berry); font-weight:600">${p.tag}</span>` : ''}
          </td>
          <td>
            <span style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.75rem; font-weight:700; color:#065f46; background:#d1fae5; border:1px solid #a7f3d0; padding:0.2rem 0.55rem; border-radius:99px;" title="Active and visible to customers on storefront">
              <span style="width:7px; height:7px; border-radius:50%; background:#10b981; box-shadow:0 0 6px #10b981;"></span>
              Live on Store
            </span>
          </td>
          <td><span class="cat-tag cat-${p.category || 'general'}">${p.category || 'general'}</span></td>
          <td>${priceHTML}</td>
          <td class="${stockNum <= 15 ? 'low' : ''}"><strong>${stockNum}</strong> ${stockNum <= 15 ? '⚠️' : ''}</td>
          <td>${p.sold || 0}</td>
          <td>★ ${Number(p.rating || 5).toFixed(1)} <span style="font-size:0.75rem; color:#9ca3af">(${p.reviews || 0})</span></td>
          <td class="action-cell">
            <a href="products.html?id=${p.id}" target="_blank" class="btn-edit" style="background:#059669; color:#fff; border-color:#059669; text-decoration:none; display:inline-flex; align-items:center; gap:0.25rem;" title="Show this product on Shop Catalog">👁️ View</a>
            <button class="btn-edit" onclick="editProduct('${p.id}')" title="Edit product details">Edit</button>
            <button class="btn-del"  onclick="confirmDelete('${p.id}')" title="Remove product">Delete</button>
          </td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="10" style="text-align:center;color:var(--muted);padding:3rem 1.5rem">
        <div style="font-size:2.2rem; margin-bottom:0.5rem">📦</div>
        <strong>No products currently in the catalog.</strong>
        <p style="font-size:0.85rem; margin-top:0.35rem">Fill in the form above and click &quot;Publish Product to Store&quot; to add your first product.</p>
      </td></tr>`;
}

// ===== FORM: TOGGLE =====
let formVisible = true;
function toggleForm() {
  formVisible = !formVisible;
  $('productForm').style.display = formVisible ? '' : 'none';
  $('formToggleBtn').textContent = formVisible ? 'Hide Editor Form ▲' : 'Show Editor Form ▼';
}

// ===== FORM: RESET =====
function resetForm() {
  $('productForm').reset();
  $('editId').value = '';
  $('fSold').value    = '0';
  $('fRating').value  = '4.9';
  $('fReviews').value = '0';
  $('fStock').value   = '25';
  $('fCategory').value = 'birthday';
  $('fDelivery').value = 'Same Day';
  $('fImage').value   = '';
  $('fOriginalPrice').value = '';
  $('fTag').value     = '';
  $('formTitle').textContent    = 'Create New Catalog Product';
  $('submitBtn').textContent    = 'Publish Product to Store';
  $('cancelBtn').style.display  = 'none';
  updatePhotoPreview();
  document.querySelectorAll('.editing-row').forEach(r => r.classList.remove('editing-row'));
}

// ===== FORM: EDIT =====
function editProduct(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  if (!formVisible) toggleForm();
  
  $('editId').value         = p.id;
  $('fName').value          = p.name || '';
  $('fCategory').value      = p.category || 'birthday';
  $('fPrice').value         = p.price || '';
  $('fOriginalPrice').value = p.originalPrice || '';
  $('fTag').value           = p.tag || '';
  $('fStock').value         = p.stock !== undefined ? p.stock : 10;
  $('fSold').value          = p.sold || 0;
  $('fRating').value        = p.rating || 4.9;
  $('fReviews').value       = p.reviews || 0;
  $('fDelivery').value      = p.deliveryTime || 'Same Day';
  $('fEmoji').value         = p.emoji || '';
  $('fImage').value         = p.image || '';
  $('fDesc').value          = p.description || '';
  $('fIncludes').value      = (Array.isArray(p.includes) ? p.includes : []).join('\n');
  
  $('formTitle').textContent   = `Modify Product #${p.id} – ${p.name}`;
  $('submitBtn').textContent   = 'Save Changes to Database';
  $('cancelBtn').style.display = 'inline-flex';
  
  updatePhotoPreview();

  document.querySelectorAll('.editing-row').forEach(r => r.classList.remove('editing-row'));
  const row = $(`row-${id}`);
  if (row) row.classList.add('editing-row');
  $('productFormPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== FORM: SAVE (ADD OR EDIT) VIA SEPARATE DATABASE =====
async function saveProduct(e) {
  if (e && e.preventDefault) e.preventDefault();
  const id = $('editId').value ? parseInt($('editId').value) : null;
  const nameVal = ($('fName')?.value || '').trim();
  const priceVal = Number($('fPrice')?.value);

  if (!nameVal) {
    toast('Please enter a product title.');
    $('fName')?.focus();
    return;
  }
  if (isNaN(priceVal) || priceVal <= 0) {
    toast('Please enter a valid selling price in ₹.');
    $('fPrice')?.focus();
    return;
  }

  const includesRaw = ($('fIncludes')?.value || '').trim();
  const includesList = includesRaw ? includesRaw.split('\n').map(s => s.trim()).filter(Boolean) : [];
  const originalPriceRaw = ($('fOriginalPrice')?.value || '').trim();
  const originalPriceVal = originalPriceRaw ? Number(originalPriceRaw) : null;

  const data = {
    name:         nameVal,
    category:     $('fCategory')?.value || 'birthday',
    price:        priceVal,
    originalPrice:originalPriceVal,
    tag:          ($('fTag')?.value || '').trim(),
    stock:        $('fStock')?.value !== '' ? Math.max(0, parseInt($('fStock').value, 10)) : 10,
    sold:         $('fSold')?.value !== '' ? Math.max(0, parseInt($('fSold').value, 10)) : 0,
    rating:       $('fRating')?.value !== '' ? parseFloat($('fRating').value) : 5.0,
    reviews:      $('fReviews')?.value !== '' ? parseInt($('fReviews').value, 10) : 0,
    deliveryTime: $('fDelivery')?.value || 'Same Day',
    emoji:        ($('fEmoji')?.value || '').trim() || '🎁',
    image:        ($('fImage')?.value || '').trim(),
    description:  ($('fDesc')?.value || '').trim(),
    includes:     includesList,
    isPublished:  true,
    status:       'live'
  };

  const submitBtn = $('submitBtn');
  const prevBtnText = submitBtn ? submitBtn.textContent : '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publishing to Store...';
  }

  let savedItem = null;

  try {
    if (id) {
      // Admin update existing product
      const res = await fetch(`${adminApiUrl}/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        savedItem = json.data;
        const idx = products.findIndex(x => String(x.id) === String(id));
        if (idx !== -1) {
          products[idx] = savedItem;
        } else {
          products.unshift(savedItem);
        }
        toast(`Product "${data.name}" updated in database.`);
      }
    } else {
      // Admin create new product
      const res = await fetch(`${adminApiUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        savedItem = json.data;
        products.unshift(savedItem);
        toast(`Product "${data.name}" published to database and storefront!`);
      }
    }
  } catch (err) {
    console.warn('API save failed, saving to local cache:', err);
  }

  // Fallback if server was offline
  if (!savedItem) {
    if (id) {
      data.id = id;
      const idx = products.findIndex(x => String(x.id) === String(id));
      if (idx !== -1) {
        products[idx] = data;
      } else {
        products.unshift(data);
      }
      savedItem = data;
      toast(`Product "${data.name}" updated locally.`);
    } else {
      data.id = nextId();
      products.unshift(data);
      savedItem = data;
      toast(`Product "${data.name}" published locally.`);
    }
  }

  persistProductsLocally();
  resetForm();
  renderAdminTable();
  updateStats();
  updateDbBadge();

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = prevBtnText;
  }

  // Display prominent Publish Success Message (Modal + Banner + Toast)
  if (savedItem) {
    lastSavedProductId = savedItem.id;
    showPublishMessage(savedItem, !!id);
  }

  setTimeout(() => {
    if (savedItem && savedItem.id) {
      const row = $(`row-${savedItem.id}`);
      if (row) {
        row.classList.add('saved-flash');
        setTimeout(() => row.classList.remove('saved-flash'), 2000);
      }
    }
  }, 100);
}

let lastSavedProductId = null;

function scrollToInventoryTable() {
  closePublishSuccessModal();
  const tableEl = $('adminProductTable') || $('productTable');
  if (tableEl) {
    tableEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (lastSavedProductId) {
    setTimeout(() => {
      const row = $(`row-${lastSavedProductId}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('saved-flash');
        setTimeout(() => row.classList.remove('saved-flash'), 2500);
      }
    }, 250);
  }
}

// ===== PUBLISH SUCCESS MESSAGE & MODAL HANDLERS =====
function showPublishMessage(product, isEdit = false) {
  if (!product) return;

  // 1. Update and show the Publish Success Modal
  const modal = $('publishSuccessModal');
  if (modal) {
    const title = $('pubSuccessTitle');
    const subtitle = $('pubSuccessSubtitle');
    const thumbBox = $('pubPreviewThumb');
    const cat = $('pubPreviewCat');
    const name = $('pubPreviewName');
    const price = $('pubPreviewPrice');
    const stock = $('pubPreviewStock');
    const liveBtn = $('pubLiveStoreBtn');

    if (title) title.textContent = isEdit ? 'Product Updated Successfully! ✏️' : 'Product Published Successfully! 🎉';
    if (subtitle) {
      subtitle.textContent = isEdit
        ? `Product "${product.name}" was updated in the master database and the customer storefront.`
        : `Product "${product.name}" is now live in the central database and visible in the table below!`;
    }

    if (thumbBox) {
      const imgUrl = typeof formatImageUrl === 'function' ? formatImageUrl(product.image) : (product.image || '');
      thumbBox.innerHTML = imgUrl
        ? `<img src="${imgUrl}" alt="${product.name}" class="pub-preview-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='grid';"><div class="pub-preview-fallback" style="display:none">${product.emoji || '🎁'}</div>`
        : `<div class="pub-preview-fallback">${product.emoji || '🎁'}</div>`;
    }

    if (cat) {
      cat.textContent = product.category || 'general';
      cat.className = `cat-tag cat-${product.category || 'general'}`;
    }
    if (name) name.textContent = product.name || 'Untitled Gift';
    if (price) price.textContent = inr(product.price);
    if (stock) stock.textContent = `📦 ${product.stock !== undefined ? product.stock : 10} in stock`;
    if (liveBtn) liveBtn.href = 'products.html';

    modal.classList.add('open');
  }

  // 2. Display the prominent inline success banner
  const banner = $('publishSuccessBanner');
  if (banner) {
    const bTitle = $('publishBannerTitle');
    const bMsg = $('publishBannerMsg');
    if (bTitle) bTitle.textContent = isEdit ? `Product Updated: "${product.name}"` : `Product Published: "${product.name}" 🎉`;
    if (bMsg) bMsg.textContent = `Live on store catalog at ${inr(product.price)}. Customers can now browse and order this gift.`;
    banner.style.display = 'flex';
  }

  // 3. Highlight toast
  toast(`🎉 Product "${product.name}" published to storefront!`, 'success');
}

function closePublishSuccessModal() {
  const modal = $('publishSuccessModal');
  if (modal) modal.classList.remove('open');
}

function dismissPublishBanner() {
  const banner = $('publishSuccessBanner');
  if (banner) banner.style.display = 'none';
}

// ===== DELETE FLOW VIA SEPARATE DATABASE =====
let pendingDeleteId = null;

async function doDeleteById(deleteId) {
  if (!deleteId) return;

  try {
    const res = await fetch(`${adminApiUrl}/api/products/${deleteId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      toast(`✓ Product #${deleteId} permanently deleted from database.`);
    }
  } catch (err) {
    console.warn('Server delete error, removing locally:', err);
    toast(`Product #${deleteId} removed locally.`);
  }

  // Remove from in-memory products list
  const idx = products.findIndex(x => String(x.id) === String(deleteId));
  if (idx !== -1) {
    products.splice(idx, 1);
  }

  persistProductsLocally();
  closeDeleteModal();
  renderAdminTable();
  updateStats();
  updateDbBadge();

  if ($('editId') && String($('editId').value) === String(deleteId)) {
    resetForm();
  }
}

function confirmDelete(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) {
    // If not in local array, still allow deleting by id
    doDeleteById(id);
    return;
  }

  pendingDeleteId = id;
  const modal = $('deleteModal');
  const modalMsg = $('deleteModalMsg');
  const confirmBtn = $('confirmDeleteBtn');

  if (modal && modalMsg && confirmBtn) {
    modalMsg.textContent = `Are you certain you wish to delete "${p.name}"? This will permanently remove it from the central database and customer storefront.`;
    modal.classList.add('open');
    confirmBtn.onclick = () => doDeleteById(pendingDeleteId);
  } else {
    // Fallback native confirm dialog if modal element is not in DOM
    if (window.confirm(`Are you certain you wish to delete "${p.name}"?`)) {
      doDeleteById(id);
    }
  }
}

function closeDeleteModal() {
  const modal = $('deleteModal');
  if (modal) modal.classList.remove('open');
  pendingDeleteId = null;
}

async function doDelete() {
  if (pendingDeleteId !== null) {
    await doDeleteById(pendingDeleteId);
  }
}

// ===== RESET DATABASE FLOW =====
function confirmResetDatabase() {
  const modal = $('resetModal');
  if (modal) modal.classList.add('open');
}

function closeResetModal() {
  const modal = $('resetModal');
  if (modal) modal.classList.remove('open');
}

async function doResetDatabase() {
  try {
    toast('Clearing catalog database...');
    const res = await fetch(`${adminApiUrl}/api/products/reset`, {
      method: 'POST'
    });
    if (res.ok) {
      products.length = 0;
      localStorage.removeItem(STORE_KEY);
      renderAdminTable();
      updateStats();
      closeResetModal();
      toast('Catalog cleared. Database is now clean.');
      return;
    }
  } catch (err) {
    console.warn('Reset error:', err);
  }
  products.length = 0;
  localStorage.removeItem(STORE_KEY);
  renderAdminTable();
  updateStats();
  closeResetModal();
  toast('Local catalog cleared.');
}

// ===== MANUAL SYNC =====
async function refreshFromDatabase() {
  toast('Syncing with central database...');
  await loadProducts();
  toast('Catalog refreshed from database!');
}

// ===== INQUIRIES TABLE (FROM DATABASE) =====
async function loadInquiries() {
  const table = $('inquiriesTable');
  if (!table) return;

  try {
    const res = await fetch(`${adminApiUrl}/api/inquiries`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        renderInquiriesTable(json.data);
        return;
      }
    }
  } catch (err) {
    console.warn('[Admin] Failed to fetch inquiries from database:', err.message);
  }

  renderInquiriesTable([]);
}

function renderInquiriesTable(inquiries) {
  const table = $('inquiriesTable');
  if (!table) return;

  table.innerHTML = inquiries.length
    ? inquiries.map(inq => {
        const dateStr = inq.createdAt ? new Date(inq.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Recent';

        return `
        <tr>
          <td><span class="row-id">#${inq.id}</span></td>
          <td><strong>${inq.name || 'Anonymous'}</strong></td>
          <td>
            <div style="font-size:0.85rem; line-height:1.4;">
              <div>📧 <a href="mailto:${inq.email}">${inq.email}</a></div>
              <div>📱 <a href="https://wa.me/${(inq.phone || '').replace(/[^0-9]/g, '')}" target="_blank">${inq.phone}</a></div>
            </div>
          </td>
          <td><span class="cat-tag" style="text-transform:capitalize;">${inq.type || 'General'}</span></td>
          <td style="max-width:280px; font-size:0.88rem; color:#374151;">${inq.message || ''}</td>
          <td style="font-size:0.8rem; color:var(--muted);">${dateStr}</td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="6" style="text-align:center; color:var(--muted); padding:2rem 1rem">
        No inquiries logged in the database yet. When visitors submit the Contact Concierge form, their requests appear here.
      </td></tr>`;
}

// ===== SALES TABLE =====
function renderSalesTable() {
  const st = $('salesTable');
  if (!st) return;
  st.innerHTML = salesData.length
    ? salesData.map(s => {
        const statusColor = s.status === 'Delivered' ? '#15803d; background:#ecfdf5' : '#b45309; background:#fef3c7';
        return `
        <tr>
          <td>${s.date}</td>
          <td><strong>${s.product}</strong></td>
          <td>${s.customer}</td>
          <td><strong>${inr(s.amount)}</strong></td>
          <td><span style="font-size:0.75rem; font-weight:700; padding:0.2rem 0.55rem; border-radius:99px; color:${statusColor}">${s.status}</span></td>
        </tr>`;
      }).join('')
    : `<tr><td colspan="5" style="text-align:center; color:var(--muted); padding:2rem 1rem">No orders logged yet.</td></tr>`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadInquiries();
  renderSalesTable();
  updateDbBadge();

  // Listen to any background products loaded event from main.js
  window.addEventListener('yuvagifts:products-loaded', () => {
    renderAdminTable();
    updateStats();
  });

  const pubModal = $('publishSuccessModal');
  if (pubModal) {
    pubModal.addEventListener('click', e => {
      if (e.target === pubModal) closePublishSuccessModal();
    });
  }
});
