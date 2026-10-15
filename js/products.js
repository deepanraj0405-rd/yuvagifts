function productCardHTML(p) {
  if (!p) return '';
  const priceNum = Number(p.price) || 0;
  const origPriceNum = p.originalPrice ? Number(p.originalPrice) : null;
  const stockCount = Number(p.stock) || 0;
  const isLowStock = stockCount <= 15 && stockCount > 0;
  const isOutOfStock = stockCount <= 0;
  
  let stockBadge = '';
  if (isOutOfStock) {
    stockBadge = `<span class="badge" style="background:#dc2626; color:#ffffff;">Out of Stock</span>`;
  } else if (isLowStock) {
    stockBadge = `<span class="badge badge-stock">Only ${stockCount} left</span>`;
  }
  
  const tagBadge = p.tag ? `<span class="badge badge-tag">${p.tag}</span>` : '';
  const stars = renderStars(p.rating || 5);

  const discount = (origPriceNum && origPriceNum > priceNum) ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100) : 0;
  const originalPriceHTML = origPriceNum ? `<span class="orig-price">₹${origPriceNum.toLocaleString('en-IN')}</span>` : '';
  const discountBadge = discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : '';

  const imgUrl = typeof formatImageUrl === 'function' ? formatImageUrl(p.image) : (p.image || '');
  const imageHTML = imgUrl
    ? `<img src="${imgUrl}" alt="${p.name || 'Gift'}" class="product-thumb" loading="lazy" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='grid';">
       <div class="product-thumb-fallback" style="display:none">${p.emoji || '🎁'}</div>`
    : `<div class="product-thumb-fallback">${p.emoji || '🎁'}</div>`;

  const descSnippet = p.description ? (p.description.length > 75 ? p.description.slice(0, 75) + '…' : p.description) : '';

  return `<article class="product-card" data-cat="${p.category || 'general'}" onclick="openProductModal(${p.id})" tabindex="0" role="button" aria-label="View ${p.name || 'Gift'} details">
    <div class="product-img-wrap">
      <div class="card-badge-row">
        ${tagBadge}
        ${stockBadge}
      </div>
      ${imageHTML}
      <div class="card-quickview-overlay">
        <span class="quickview-pill">Quick View</span>
      </div>
    </div>

    <div class="product-info">
      <div class="product-top-row">
        <span class="category">${p.category || 'Gift'}</span>
        <span class="delivery-pill">⚡ ${p.deliveryTime || 'Same Day'}</span>
      </div>
      <h3 class="product-title">${p.name || 'Untitled Gift'}</h3>
      <p class="product-desc-short">${descSnippet}</p>
      
      <div class="rating-row">
        ${stars}
        <span class="rating-score">${Number(p.rating || 5).toFixed(1)}</span>
        <span class="review-count">(${p.reviews || 0})</span>
      </div>

      <div class="price-row">
        <div class="price-group">
          <span class="price">₹${priceNum.toLocaleString('en-IN')}</span>
          ${originalPriceHTML}
          ${discountBadge}
        </div>
        <span class="sold-count">${p.sold || 0} ordered</span>
      </div>
    </div>

    <div class="product-actions">
      <button class="btn-whatsapp" onclick="event.stopPropagation(); sendToWhatsApp(${p.id})" title="Order ${p.name || 'Gift'} on WhatsApp">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        <span>Order on WhatsApp</span>
      </button>
      <button class="btn-details" onclick="event.stopPropagation(); openProductModal(${p.id})">Details</button>
    </div>
  </article>`;
}

function renderProductGrid(list) {
  const g = document.getElementById('productGrid');
  if (!g) return;
  if (!list.length) {
    if (products.length === 0) {
      g.innerHTML = `<div class="empty" style="grid-column:1/-1; text-align:center; padding:4rem 1.5rem">
        <div class="empty-icon" style="font-size:3rem; margin-bottom:1rem">🎁</div>
        <h3 style="font-size:1.4rem; margin-bottom:0.5rem">Your Store Catalog is Ready</h3>
        <p style="color:var(--muted); max-width:440px; margin:0 auto 1.5rem">No products have been published yet. Log in to the Administrator Portal to add and manage your gifts.</p>
        <a href="admin-dashboard.html" class="btn-primary" style="display:inline-flex">Open Admin Dashboard</a>
      </div>`;
    } else {
      g.innerHTML = `<div class="empty" style="grid-column:1/-1; text-align:center; padding:3.5rem 1.5rem">
        <div class="empty-icon" style="font-size:2.8rem; margin-bottom:1rem">🔍</div>
        <h3>No matching gifts found</h3>
        <p style="color:var(--muted); margin-bottom:1.5rem">Try searching with another keyword or reset the occasion filter.</p>
        <button class="btn-ghost" onclick="resetFilters()">Reset All Filters</button>
      </div>`;
    }
    return;
  }
  g.innerHTML = list.map(productCardHTML).join('');
  g.querySelectorAll('.product-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 40}ms`;
    card.classList.add('card-enter');
  });
  g.querySelectorAll('.product-card[tabindex]').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

function filterProducts() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const c = (document.getElementById('categoryFilter')?.value || 'all').toLowerCase().trim();
  const s = document.getElementById('sortSelect')?.value || '';
  
  const list = products.filter(p => {
    if (!p) return false;
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const descMatch = (p.description || '').toLowerCase().includes(q);
    const catMatch = c === 'all' || (p.category || '').toLowerCase().trim() === c;
    return (nameMatch || descMatch) && catMatch;
  });

  if (s === 'low')     list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  if (s === 'high')    list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  if (s === 'popular') list.sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0));
  if (s === 'rating')  list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));

  renderProductGrid(list);

  const countEl = document.getElementById('resultCount');
  if (countEl) {
    if (products.length === 0) {
      countEl.innerHTML = `No products in catalog yet.`;
    } else {
      countEl.innerHTML = `Showing <strong>${list.length}</strong> curated gift${list.length !== 1 ? 's' : ''}`;
    }
  }
}

function resetFilters() {
  const s = document.getElementById('searchInput');
  const c = document.getElementById('categoryFilter');
  const sort = document.getElementById('sortSelect');
  if (s) s.value = '';
  if (c) c.value = 'all';
  if (sort) sort.value = '';
  filterProducts();
}

async function renderAllProducts() {
  const cat = new URLSearchParams(location.search).get('cat');
  if (cat && document.getElementById('categoryFilter')) {
    document.getElementById('categoryFilter').value = cat.toLowerCase();
  }
  
  // Initial immediate filter with cached/local products
  filterProducts();

  ['searchInput', 'categoryFilter', 'sortSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(id === 'searchInput' ? 'input' : 'change', filterProducts);
  });

  // Re-filter whenever central database products load or change
  window.addEventListener('yuvagifts:products-loaded', () => {
    filterProducts();
  });

  // Proactively fetch latest catalog from database
  if (typeof fetchProductsFromDB === 'function') {
    await fetchProductsFromDB();
    filterProducts();
  }

  // Open & highlight specific product if requested via URL query (?id=...)
  const targetId = new URLSearchParams(location.search).get('id');
  if (targetId) {
    setTimeout(() => {
      const card = document.querySelector(`.product-card[onclick*="openProductModal(${targetId})"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.outline = '3px solid var(--gold, #d4af37)';
        card.style.outlineOffset = '4px';
      }
      if (typeof openProductModal === 'function') {
        openProductModal(targetId);
      }
    }, 350);
  }
}

function sendToWhatsApp(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  const priceFormatted = Number(p.price || 0).toLocaleString('en-IN');
  const delivery = p.deliveryTime || 'Same Day';
  const msg = `Hello Yuvagifts Concierge,\n\nI would like to place an order for:\n🎁 *${p.name}*\n🏷️ *Price:* ₹${priceFormatted}\n📍 *Delivery:* ${delivery}\n\nPlease confirm availability and guide me with the recipient details & message note. Thank you!`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}
