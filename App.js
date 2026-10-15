import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';

const { width } = Dimensions.get('window');
const WHATSAPP_NUMBER = '918637604442';

// API Configuration (Supports local Node server or operates fully offline)
const API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

// Initial curated luxury gifts catalog
const INITIAL_PRODUCTS = [
  {
    id: 1,
    name: 'Crimson Rose Elegance Bouquet',
    category: 'birthday',
    price: 899,
    originalPrice: 1199,
    tag: 'Bestseller',
    emoji: '🌹',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    stock: 25,
    sold: 18,
    rating: 4.9,
    reviews: 34,
    deliveryTime: 'Same Day',
    description: '24 hand-selected Dutch crimson roses accented with fresh eucalyptus foliage and tied with artisanal double-faced satin ribbon.',
    includes: [
      '24 Fresh Long-Stem Crimson Roses',
      'Fragrant Eucalyptus & Baby\'s Breath',
      'Luxury Kraft Wrapping with Gold Foil Trim',
      'Handwritten Message Card & Envelope'
    ]
  },
  {
    id: 2,
    name: 'Grand Royale Gourmet Hamper',
    category: 'anniversary',
    price: 1499,
    originalPrice: 1999,
    tag: 'Luxury Edition',
    emoji: '🍫',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    stock: 15,
    sold: 12,
    rating: 5.0,
    reviews: 22,
    deliveryTime: 'Same Day',
    description: 'An opulent curation of handcrafted Belgian pralines, artisanal dry fruit confectioneries, premium roast Arabica coffee, and organic honey in a bespoke keepsake trunk.',
    includes: [
      'Assorted Belgian Truffles & Pralines (250g)',
      'Roasted California Almonds & Cashews (200g)',
      'Cold-Pressed Single-Estate Forest Honey',
      'Handcrafted Reusable Velvet Trunk with Lock'
    ]
  },
  {
    id: 3,
    name: 'Heritage Brass Diya & Festive Keepsake',
    category: 'festival',
    price: 749,
    originalPrice: 999,
    tag: 'Festive Special',
    emoji: '🪔',
    image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=800&q=80',
    stock: 30,
    sold: 45,
    rating: 4.8,
    reviews: 19,
    deliveryTime: 'Same Day',
    description: 'Hand-carved traditional brass oil lamp paired with fragrant pure sandalwood incense and authentic Indian sweets in a golden gift box.',
    includes: [
      'Solid Brass Hand-Engraved Peacock Diya',
      'Pure Mysore Sandalwood Dhoop Cones',
      'Artisanal Kaju Katli Sweet Box (200g)',
      'Festive Presentation Box with Gold Tassel'
    ]
  }
];

export default function App() {
  // Navigation & View State: 'home' | 'catalog' | 'admin'
  const [activeTab, setActiveTab] = useState('home');

  // Products Database State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Catalog Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState('featured');

  // Admin Form State
  const [editingId, setEditingId] = useState(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('birthday');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formStock, setFormStock] = useState('25');
  const [formImage, setFormImage] = useState('');
  const [formEmoji, setFormEmoji] = useState('🎁');
  const [formDesc, setFormDesc] = useState('');
  const [formIncludes, setFormIncludes] = useState('');

  // Toast / Confirmation Alert State
  const [toastMessage, setToastMessage] = useState(null);
  const [publishSuccessProduct, setPublishSuccessProduct] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  // Fetch from live Express / MongoDB backend if available
  useEffect(() => {
    async function fetchFromBackend() {
      try {
        const response = await fetch(`${API_BASE}/api/products`);
        if (response.ok) {
          const json = await response.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setProducts(json.data);
          }
        }
      } catch (_) {
        // Operates seamlessly offline with initial state
      }
    }
    fetchFromBackend();
  }, []);

  // Display luxury toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // WhatsApp Order Handler
  const orderOnWhatsApp = (product) => {
    if (!product) return;
    const msg = `Hello Yuvagifts Concierge,\n\nI would like to place an order for:\n🎁 *${product.name}*\n🏷️ *Price:* ₹${Number(product.price).toLocaleString('en-IN')}\n📍 *Delivery:* ${product.deliveryTime || 'Same Day'}\n\nPlease confirm availability and guide me with the recipient details. Thank you!`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open WhatsApp on this device.');
    });
  };

  // General Concierge Chat
  const openConciergeWhatsApp = () => {
    const msg = "Hello Yuvagifts Concierge, I would like assistance with luxury gift curation.";
    Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('WhatsApp Error', 'Could not launch WhatsApp.');
    });
  };

  // Filtered & Sorted Catalog
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchQuery && matchCat;
    });

    if (sortOption === 'low') list.sort((a, b) => a.price - b.price);
    if (sortOption === 'high') list.sort((a, b) => b.price - a.price);
    if (sortOption === 'rating') list.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    if (sortOption === 'popular') list.sort((a, b) => (b.sold || 0) - (a.sold || 0));

    return list;
  }, [products, searchQuery, selectedCategory, sortOption]);

  // Admin: Save or Publish Product
  const handleSaveProduct = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation Error', 'Please enter a product title.');
      return;
    }
    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price in ₹.');
      return;
    }

    const includesArr = formIncludes
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const productPayload = {
      name: formName.trim(),
      category: formCategory.toLowerCase().trim(),
      price: priceNum,
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : null,
      tag: formTag.trim(),
      emoji: formEmoji.trim() || '🎁',
      image: formImage.trim(),
      stock: formStock ? Number(formStock) : 10,
      sold: 0,
      rating: 5.0,
      reviews: 0,
      deliveryTime: 'Same Day',
      description: formDesc.trim(),
      includes: includesArr
    };

    let updatedList = [...products];
    let savedItem = null;

    if (editingId) {
      // Update existing
      updatedList = updatedList.map((p) => (p.id === editingId ? { ...p, ...productPayload } : p));
      savedItem = { id: editingId, ...productPayload };
      showToast(`Updated "${productPayload.name}"`);
    } else {
      // Create new
      const nextId = products.length ? Math.max(...products.map((p) => p.id || 0)) + 1 : 1;
      savedItem = { id: nextId, ...productPayload };
      updatedList.unshift(savedItem);
      showToast(`Published "${productPayload.name}" to store!`);
    }

    setProducts(updatedList);

    // Sync to backend API if live
    try {
      if (editingId) {
        await fetch(`${API_BASE}/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload)
        });
      } else {
        await fetch(`${API_BASE}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productPayload)
        });
      }
    } catch (_) {}

    // Reset Form
    setEditingId(null);
    setFormName('');
    setFormPrice('');
    setFormOriginalPrice('');
    setFormTag('');
    setFormStock('25');
    setFormImage('');
    setFormDesc('');
    setFormIncludes('');

    // Trigger Success Publish Modal
    setPublishSuccessProduct(savedItem);
    setShowPublishModal(true);
  };

  // Admin: Delete Product
  const handleDeleteProduct = (id) => {
    const item = products.find((p) => p.id === id);
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to remove "${item?.name}" from the store catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            showToast('Product removed from store.');
            try {
              await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
            } catch (_) {}
          }
        }
      ]
    );
  };

  // Admin: Populate Form for Edit
  const handleEditProduct = (product) => {
    setEditingId(product.id);
    setFormName(product.name || '');
    setFormCategory(product.category || 'birthday');
    setFormPrice(String(product.price || ''));
    setFormOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
    setFormTag(product.tag || '');
    setFormStock(String(product.stock !== undefined ? product.stock : 25));
    setFormImage(product.image || '');
    setFormEmoji(product.emoji || '🎁');
    setFormDesc(product.description || '');
    setFormIncludes(Array.isArray(product.includes) ? product.includes.join('\n') : '');
    setActiveTab('admin');
  };

  // ----------------------------------------------------
  // SUB-COMPONENTS
  // ----------------------------------------------------

  // Header Component
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerBrand}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>YG</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>
            YUVA<Text style={styles.headerTitleBold}>GIFTS</Text>
          </Text>
          <Text style={styles.headerSub}>Luxury Gifting Boutique</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.conciergeHeaderBtn} onPress={openConciergeWhatsApp}>
        <Text style={styles.conciergeHeaderBtnText}>💬 Concierge</Text>
      </TouchableOpacity>
    </View>
  );

  // Bottom Navigation Bar
  const renderBottomNav = () => (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
        onPress={() => setActiveTab('home')}
      >
        <Text style={styles.navIcon}>🏠</Text>
        <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'catalog' && styles.navItemActive]}
        onPress={() => setActiveTab('catalog')}
      >
        <Text style={styles.navIcon}>🎁</Text>
        <Text style={[styles.navText, activeTab === 'catalog' && styles.navTextActive]}>Catalog</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === 'admin' && styles.navItemActive]}
        onPress={() => setActiveTab('admin')}
      >
        <Text style={styles.navIcon}>⚙️</Text>
        <Text style={[styles.navText, activeTab === 'admin' && styles.navTextActive]}>Admin Panel</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={openConciergeWhatsApp}>
        <Text style={styles.navIcon}>📲</Text>
        <Text style={styles.navText}>WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );

  // Product Card Item
  const renderProductCard = (product) => {
    const discount =
      product.originalPrice && product.originalPrice > product.price
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    return (
      <TouchableOpacity
        key={product.id}
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          setSelectedProduct(product);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardImageContainer}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardEmojiFallback}>
              <Text style={{ fontSize: 50 }}>{product.emoji || '🎁'}</Text>
            </View>
          )}

          <View style={styles.cardBadgesRow}>
            {product.tag ? (
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>{product.tag}</Text>
              </View>
            ) : <View />}
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardCategoryRow}>
            <Text style={styles.cardCategory}>{product.category}</Text>
            <Text style={styles.cardDelivery}>⚡ {product.deliveryTime || 'Same Day'}</Text>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.cardRatingRow}>
            <Text style={styles.cardStars}>★★★★★</Text>
            <Text style={styles.cardRating}>{Number(product.rating || 5.0).toFixed(1)}</Text>
            <Text style={styles.cardReviews}>({product.reviews || 0})</Text>
          </View>

          <View style={styles.cardPriceRow}>
            <Text style={styles.cardPrice}>₹{Number(product.price).toLocaleString('en-IN')}</Text>
            {product.originalPrice && (
              <Text style={styles.cardOriginalPrice}>
                ₹{Number(product.originalPrice).toLocaleString('en-IN')}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.cardWhatsAppBtn}
            onPress={(e) => {
              e.stopPropagation();
              orderOnWhatsApp(product);
            }}
          >
            <Text style={styles.cardWhatsAppBtnText}>💬 Order on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ----------------------------------------------------
  // SCREEN: HOME
  // ----------------------------------------------------
  const renderHomeScreen = () => (
    <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTag}>
          <Text style={styles.heroTagText}>BESPOKE GIFTING LUXURY</Text>
        </View>
        <Text style={styles.heroTitle}>Curated Floral &amp; Gourmet Treasures</Text>
        <Text style={styles.heroSub}>
          Handcrafted arrangements, artisanal delicacies, and bespoke keepsakes. White-glove same-day delivery with personalized notes.
        </Text>
        <View style={styles.heroActionsRow}>
          <TouchableOpacity style={styles.heroPrimaryBtn} onPress={() => setActiveTab('catalog')}>
            <Text style={styles.heroPrimaryBtnText}>Explore Master Catalog &rarr;</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Occasions / Category Strip */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>OCCASIONS</Text>
        <Text style={styles.sectionTitle}>Shop by Celebration</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.occasionsScroll}>
        {[
          { key: 'birthday', label: '🎂 Birthday', name: 'Birthday' },
          { key: 'anniversary', label: '💍 Anniversary', name: 'Anniversary' },
          { key: 'wedding', label: '💐 Wedding', name: 'Wedding' },
          { key: 'festival', label: '🪔 Festive', name: 'Festive' }
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.occasionChip}
            onPress={() => {
              setSelectedCategory(item.key);
              setActiveTab('catalog');
            }}
          >
            <Text style={styles.occasionChipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending Bestsellers */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEyebrow}>MOST REQUESTED</Text>
        <Text style={styles.sectionTitle}>Trending Luxury Gifts</Text>
      </View>
      <View style={styles.productsGrid}>
        {products.slice(0, 4).map(renderProductCard)}
      </View>

      {/* Concierge Banner */}
      <View style={styles.conciergeBanner}>
        <Text style={styles.conciergeTag}>CORPORATE &amp; CUSTOM ORDERS</Text>
        <Text style={styles.conciergeTitle}>Need Bespoke Hampers?</Text>
        <Text style={styles.conciergeDesc}>
          Speak directly with our dedicated gifting stylists on WhatsApp for custom ribbon branding and corporate bulk pricing.
        </Text>
        <TouchableOpacity style={styles.conciergeBtn} onPress={openConciergeWhatsApp}>
          <Text style={styles.conciergeBtnText}>💬 Connect on WhatsApp</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ----------------------------------------------------
  // SCREEN: CATALOG
  // ----------------------------------------------------
  const renderCatalogScreen = () => (
    <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchBarWrap}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by gift name, category, or note..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Categories Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {[
          { key: 'all', label: 'All Curations' },
          { key: 'birthday', label: '🎂 Birthday' },
          { key: 'anniversary', label: '💍 Anniversary' },
          { key: 'wedding', label: '💐 Wedding' },
          { key: 'festival', label: '🪔 Festive' }
        ].map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.filterPill, selectedCategory === c.key && styles.filterPillActive]}
            onPress={() => setSelectedCategory(c.key)}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedCategory === c.key && styles.filterPillTextActive
              ]}
            >
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sorting Tabs */}
      <View style={styles.sortRow}>
        <Text style={styles.resultsCount}>
          Showing <Text style={{ fontWeight: '700' }}>{filteredProducts.length}</Text> gifts
        </Text>
        <View style={styles.sortPillsGroup}>
          {[
            { key: 'featured', label: 'Featured' },
            { key: 'low', label: 'Price ↑' },
            { key: 'high', label: 'Price ↓' },
            { key: 'rating', label: 'Top Rated' }
          ].map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.sortMiniPill, sortOption === s.key && styles.sortMiniPillActive]}
              onPress={() => setSortOption(s.key)}
            >
              <Text
                style={[
                  styles.sortMiniPillText,
                  sortOption === s.key && styles.sortMiniPillTextActive
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Grid of Products */}
      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🎁</Text>
          <Text style={styles.emptyTitle}>No matching curations found</Text>
          <Text style={styles.emptySub}>Try searching for another keyword or reset the category filter.</Text>
          <TouchableOpacity
            style={styles.emptyResetBtn}
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.productsGrid}>{filteredProducts.map(renderProductCard)}</View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ----------------------------------------------------
  // SCREEN: ADMIN MANAGEMENT DASHBOARD
  // ----------------------------------------------------
  const renderAdminScreen = () => (
    <ScrollView style={styles.screenScroll} showsVerticalScrollIndicator={false}>
      {/* Admin Stats Row */}
      <View style={styles.adminStatsRow}>
        <View style={styles.adminStatCard}>
          <Text style={styles.adminStatNumber}>{products.length}</Text>
          <Text style={styles.adminStatLabel}>Active Gifts</Text>
        </View>
        <View style={styles.adminStatCard}>
          <Text style={styles.adminStatNumber}>
            {products.reduce((acc, p) => acc + (p.sold || 0), 0)}
          </Text>
          <Text style={styles.adminStatLabel}>Orders Dispatched</Text>
        </View>
        <View style={styles.adminStatCard}>
          <Text style={styles.adminStatNumber}>
            ₹{products.reduce((acc, p) => acc + p.price * (p.sold || 0), 0).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.adminStatLabel}>Store Revenue</Text>
        </View>
      </View>

      {/* Add / Edit Product Form Card */}
      <View style={styles.adminFormCard}>
        <Text style={styles.adminFormTitle}>
          {editingId ? `Modify Product #${editingId}` : 'Publish New Gift to Store'}
        </Text>
        <Text style={styles.adminFormSub}>
          Any additions or modifications update immediately across the entire customer store catalog.
        </Text>

        <Text style={styles.inputLabel}>Product Title *</Text>
        <TextInput
          style={styles.formInput}
          placeholder="e.g. 24 Dutch Crimson Roses Bouquet"
          value={formName}
          onChangeText={setFormName}
        />

        <View style={styles.formRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.inputLabel}>Selling Price (₹) *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 899"
              keyboardType="numeric"
              value={formPrice}
              onChangeText={setFormPrice}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.inputLabel}>Original M.R.P (₹)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 1199"
              keyboardType="numeric"
              value={formOriginalPrice}
              onChangeText={setFormOriginalPrice}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.inputLabel}>Category</Text>
            <TextInput
              style={styles.formInput}
              placeholder="birthday / anniversary / etc."
              value={formCategory}
              onChangeText={setFormCategory}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.inputLabel}>Curator Tag</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Bestseller / Luxury Edition"
              value={formTag}
              onChangeText={setFormTag}
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Product Photo Image URL</Text>
        <TextInput
          style={styles.formInput}
          placeholder="https://images.unsplash.com/photo-..."
          value={formImage}
          onChangeText={setFormImage}
        />

        <Text style={styles.inputLabel}>Product Description</Text>
        <TextInput
          style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
          placeholder="Sensory details, bloom varieties, origin, or fragrance notes..."
          multiline
          value={formDesc}
          onChangeText={setFormDesc}
        />

        <Text style={styles.inputLabel}>Package Inclusions (One item per line)</Text>
        <TextInput
          style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
          placeholder="24 Fresh Long-Stem Crimson Roses&#10;Complimentary Handwritten Greeting Card"
          multiline
          value={formIncludes}
          onChangeText={setFormIncludes}
        />

        <TouchableOpacity style={styles.publishBtn} onPress={handleSaveProduct}>
          <Text style={styles.publishBtnText}>
            {editingId ? 'Save Changes to Database' : 'Publish Product to Store'}
          </Text>
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity
            style={styles.cancelEditBtn}
            onPress={() => {
              setEditingId(null);
              setFormName('');
              setFormPrice('');
            }}
          >
            <Text style={styles.cancelEditBtnText}>Cancel Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Master Inventory Management List */}
      <View style={styles.inventoryCard}>
        <Text style={styles.inventoryTitle}>Master Catalog Inventory ({products.length})</Text>

        {products.map((p) => (
          <View key={p.id} style={styles.inventoryRow}>
            <View style={styles.inventoryThumbBox}>
              {p.image ? (
                <Image source={{ uri: p.image }} style={styles.inventoryThumb} />
              ) : (
                <Text style={{ fontSize: 24 }}>{p.emoji || '🎁'}</Text>
              )}
            </View>

            <View style={styles.inventoryInfo}>
              <Text style={styles.inventoryName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.inventoryMeta}>
                ₹{Number(p.price).toLocaleString('en-IN')} · {p.category} · {p.stock} in stock
              </Text>
            </View>

            <View style={styles.inventoryActions}>
              <TouchableOpacity
                style={styles.inventoryActionBtn}
                onPress={() => handleEditProduct(p)}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inventoryActionBtn, styles.deleteBtn]}
                onPress={() => handleDeleteProduct(p.id)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#120717" />

      {/* Header */}
      {renderHeader()}

      {/* Dynamic Screen View */}
      {activeTab === 'home' && renderHomeScreen()}
      {activeTab === 'catalog' && renderCatalogScreen()}
      {activeTab === 'admin' && renderAdminScreen()}

      {/* Bottom Navigation */}
      {renderBottomNav()}

      {/* Product Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedProduct.image ? (
                  <Image
                    source={{ uri: selectedProduct.image }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalEmojiBox}>
                    <Text style={{ fontSize: 60 }}>{selectedProduct.emoji || '🎁'}</Text>
                  </View>
                )}

                <View style={styles.modalBody}>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalCategory}>{selectedProduct.category}</Text>
                    <Text style={styles.modalDelivery}>⚡ {selectedProduct.deliveryTime || 'Same Day'}</Text>
                  </View>

                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>

                  <View style={styles.modalRatingRow}>
                    <Text style={styles.modalStars}>★★★★★</Text>
                    <Text style={styles.modalRatingNum}>
                      {Number(selectedProduct.rating || 5.0).toFixed(1)}
                    </Text>
                    <Text style={styles.modalReviewsNum}>
                      ({selectedProduct.reviews || 0} reviews)
                    </Text>
                  </View>

                  <View style={styles.modalPriceContainer}>
                    <Text style={styles.modalPrice}>
                      ₹{Number(selectedProduct.price).toLocaleString('en-IN')}
                    </Text>
                    {selectedProduct.originalPrice && (
                      <Text style={styles.modalOrigPrice}>
                        ₹{Number(selectedProduct.originalPrice).toLocaleString('en-IN')}
                      </Text>
                    )}
                    <Text style={styles.taxNote}>Inclusive of complimentary luxury gift box</Text>
                  </View>

                  <Text style={styles.modalDesc}>{selectedProduct.description}</Text>

                  {/* Curated Inclusions */}
                  <Text style={styles.inclusionsTitle}>Gift Set Inclusions:</Text>
                  {selectedProduct.includes &&
                    selectedProduct.includes.map((inc, index) => (
                      <View key={index} style={styles.inclusionItem}>
                        <Text style={styles.checkIcon}>✓</Text>
                        <Text style={styles.inclusionText}>{inc}</Text>
                      </View>
                    ))}

                  <TouchableOpacity
                    style={styles.modalWhatsAppBtn}
                    onPress={() => {
                      setModalVisible(false);
                      orderOnWhatsApp(selectedProduct);
                    }}
                  >
                    <Text style={styles.modalWhatsAppBtnText}>💬 Order Instantly on WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Publish Success Confirmation Modal */}
      <Modal visible={showPublishModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.publishModalCard}>
            <Text style={{ fontSize: 50, textAlign: 'center', marginBottom: 10 }}>🎉</Text>
            <Text style={styles.publishModalTitle}>Product Published Successfully!</Text>
            <Text style={styles.publishModalSub}>
              "{publishSuccessProduct?.name}" is now live in the central catalog and ready for customers.
            </Text>

            <TouchableOpacity
              style={styles.publishModalStoreBtn}
              onPress={() => {
                setShowPublishModal(false);
                setActiveTab('catalog');
              }}
            >
              <Text style={styles.publishModalStoreBtnText}>👁️ View in Store Catalog</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publishModalDismissBtn}
              onPress={() => setShowPublishModal(false)}
            >
              <Text style={styles.publishModalDismissBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast Bar */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>✨ {toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// LUXURY BRAND STYLESHEET
// ----------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0512'
  },
  screenScroll: {
    flex: 1,
    backgroundColor: '#faf7fa'
  },

  // Header
  header: {
    backgroundColor: '#120717',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#701a44',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 1.5,
    fontWeight: '400'
  },
  headerTitleBold: {
    fontWeight: '800',
    color: '#fbcfe8'
  },
  headerSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  conciergeHeaderBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  conciergeHeaderBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#120717',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  navText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600'
  },
  navTextActive: {
    color: '#f472b6',
    fontWeight: '800'
  },

  // Home Screen
  heroBanner: {
    backgroundColor: '#190a20',
    padding: 22,
    margin: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  heroTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244,114,182,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10
  },
  heroTagText: {
    color: '#f472b6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8
  },
  heroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16
  },
  heroPrimaryBtn: {
    backgroundColor: '#701a44',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center'
  },
  heroPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },

  // Section Headers
  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 14,
    marginBottom: 10
  },
  sectionEyebrow: {
    color: '#701a44',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  sectionTitle: {
    color: '#120717',
    fontSize: 19,
    fontWeight: '800'
  },
  occasionsScroll: {
    paddingLeft: 16,
    marginBottom: 16
  },
  occasionChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  occasionChipText: {
    color: '#120717',
    fontWeight: '700',
    fontSize: 13
  },

  // Product Grid & Card
  productsGrid: {
    paddingHorizontal: 16
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee4ed',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8
  },
  cardImageContainer: {
    height: 200,
    backgroundColor: '#f3e8f0',
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  cardEmojiFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardBadgesRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tagBadge: {
    backgroundColor: 'rgba(18,7,23,0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  tagBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  discountBadge: {
    backgroundColor: '#be185d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  discountBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  cardBody: {
    padding: 14
  },
  cardCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  cardCategory: {
    color: '#701a44',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  cardDelivery: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700'
  },
  cardTitle: {
    color: '#120717',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8
  },
  cardStars: {
    color: '#f59e0b',
    fontSize: 13
  },
  cardRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#120717'
  },
  cardReviews: {
    fontSize: 11,
    color: '#6b7280'
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12
  },
  cardPrice: {
    color: '#701a44',
    fontSize: 18,
    fontWeight: '800'
  },
  cardOriginalPrice: {
    color: '#9ca3af',
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  cardWhatsAppBtn: {
    backgroundColor: '#128c7e',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  cardWhatsAppBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },

  // Concierge Banner
  conciergeBanner: {
    backgroundColor: '#701a44',
    margin: 16,
    padding: 20,
    borderRadius: 16
  },
  conciergeTag: {
    color: '#fbcfe8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  conciergeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  conciergeDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14
  },
  conciergeBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  conciergeBtnText: {
    color: '#701a44',
    fontWeight: '800',
    fontSize: 13
  },

  // Catalog Screen
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#120717'
  },
  categoriesScroll: {
    paddingLeft: 16,
    marginBottom: 8
  },
  filterPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  filterPillActive: {
    backgroundColor: '#701a44',
    borderColor: '#701a44'
  },
  filterPillText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 12
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  resultsCount: {
    fontSize: 12,
    color: '#6b7280'
  },
  sortPillsGroup: {
    flexDirection: 'row',
    gap: 4
  },
  sortMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#e5e7eb'
  },
  sortMiniPillActive: {
    backgroundColor: '#701a44'
  },
  sortMiniPillText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600'
  },
  sortMiniPillTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#120717',
    marginBottom: 4
  },
  emptySub: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 14
  },
  emptyResetBtn: {
    backgroundColor: '#701a44',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  emptyResetBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },

  // Admin Screen
  adminStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 14
  },
  adminStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center'
  },
  adminStatNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#701a44'
  },
  adminStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2
  },
  adminFormCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  adminFormTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#120717',
    marginBottom: 2
  },
  adminFormSub: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    marginTop: 8
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#120717'
  },
  formRow: {
    flexDirection: 'row'
  },
  publishBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16
  },
  publishBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  cancelEditBtn: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  cancelEditBtnText: {
    color: '#4b5563',
    fontWeight: '700',
    fontSize: 12
  },
  inventoryCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  inventoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#120717',
    marginBottom: 12
  },
  inventoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  inventoryThumbBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f3e8f0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  inventoryThumb: {
    width: '100%',
    height: '100%'
  },
  inventoryInfo: {
    flex: 1
  },
  inventoryName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#120717'
  },
  inventoryMeta: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2
  },
  inventoryActions: {
    flexDirection: 'row',
    gap: 6
  },
  inventoryActionBtn: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6
  },
  deleteBtn: {
    backgroundColor: '#fee2e2'
  },
  editBtnText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700'
  },
  deleteBtnText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700'
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(14,5,18,0.75)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden'
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  modalImage: {
    width: '100%',
    height: 220
  },
  modalEmojiBox: {
    height: 180,
    backgroundColor: '#f3e8f0',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBody: {
    padding: 18
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  modalCategory: {
    color: '#701a44',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  modalDelivery: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700'
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#120717',
    marginBottom: 6
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  modalStars: {
    color: '#f59e0b',
    fontSize: 14
  },
  modalRatingNum: {
    fontWeight: '700',
    fontSize: 13,
    color: '#120717'
  },
  modalReviewsNum: {
    fontSize: 12,
    color: '#6b7280'
  },
  modalPriceContainer: {
    backgroundColor: '#fdf4f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12
  },
  modalPrice: {
    color: '#701a44',
    fontSize: 22,
    fontWeight: '900'
  },
  modalOrigPrice: {
    color: '#9ca3af',
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  taxNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2
  },
  modalDesc: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 19,
    marginBottom: 14
  },
  inclusionsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#120717',
    marginBottom: 6
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  checkIcon: {
    color: '#059669',
    fontWeight: '800',
    marginRight: 8
  },
  inclusionText: {
    fontSize: 12,
    color: '#374151'
  },
  modalWhatsAppBtn: {
    backgroundColor: '#128c7e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18
  },
  modalWhatsAppBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15
  },

  // Publish Success Modal
  publishModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    alignSelf: 'center',
    width: width - 48,
    alignItems: 'center'
  },
  publishModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#065f46',
    textAlign: 'center',
    marginBottom: 6
  },
  publishModalSub: {
    fontSize: 13,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18
  },
  publishModalStoreBtn: {
    backgroundColor: '#701a44',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8
  },
  publishModalStoreBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  publishModalDismissBtn: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center'
  },
  publishModalDismissBtnText: {
    color: '#6b7280',
    fontWeight: '700',
    fontSize: 13
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(18,7,23,0.95)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  toastText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
