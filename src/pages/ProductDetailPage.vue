<template>
  <div class="page-container">
    <!-- Back button -->
    <button class="btn btn-secondary btn-sm mb-3" @click="$router.back()">
      ← Quay lại
    </button>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" style="width: 2rem; height: 2rem;"></div>
      <p class="text-muted mt-1">Đang tải thông tin sản phẩm...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      {{ error }}
    </div>

    <div v-else-if="summary" class="detail-layout">
      <!-- Left: Product Info -->
      <div class="detail-main">
        <!-- Product Hero -->
        <div class="card product-hero">
          <div class="product-hero-image">
            <span class="hero-emoji">{{ getEmoji(summary.item.title) }}</span>
          </div>
          <div class="product-hero-body">
            <div class="flex gap-1 items-center mb-2">
              <span class="badge badge-accent">{{ summary.category.name }}</span>
              <span class="text-xs text-muted">ID: #{{ summary.item.id }}</span>
            </div>
            <h1 class="product-title">{{ summary.item.title }}</h1>
            <p class="category-info text-muted text-sm mb-2">{{ summary.category.info }}</p>
            <div class="price-tag">${{ summary.item.unit_price.toFixed(2) }}</div>
            <div class="product-meta-row">
              <div class="meta-item">
                <span class="meta-label">Ngày tạo</span>
                <span class="meta-value">{{ summary.item.created_date }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Danh mục ID</span>
                <span class="meta-value">#{{ summary.item.category_id }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Cập nhật lúc</span>
                <span class="meta-value">{{ formatTime(summary.aggregated_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="card mt-2">
          <div class="section-header">
            <h2 class="text-lg font-semibold">Đánh giá</h2>
            <span class="badge badge-accent">{{ summary.reviews.length }} đánh giá</span>
          </div>
          <div v-if="summary.reviews.length === 0" class="empty-state" style="padding: 2rem">
            <div class="empty-icon">💬</div>
            <p>Chưa có đánh giá nào</p>
          </div>
          <div v-else class="reviews-list">
            <div v-for="(review, i) in summary.reviews" :key="i" class="review-item">
              <div class="review-header">
                <div class="reviewer-avatar">{{ review.reviewer.charAt(0).toUpperCase() }}</div>
                <div>
                  <div class="reviewer-name">{{ review.reviewer }}</div>
                  <div class="review-date text-xs text-muted">{{ review.date }}</div>
                </div>
                <div class="review-stars ml-auto">
                  <span v-for="n in 5" :key="n" class="star" :class="{ empty: n > review.stars }">★</span>
                </div>
              </div>
              <p class="review-text">{{ review.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Stock & Summary -->
      <div class="detail-sidebar">
        <!-- Stock Card -->
        <div class="card stock-card">
          <h3 class="font-semibold mb-2">📦 Tình trạng kho</h3>
          <div class="stock-status" :class="summary.stock_status.available ? 'available' : 'unavailable'">
            <span class="stock-dot"></span>
            <span>{{ summary.stock_status.status_message }}</span>
          </div>
          <div class="stock-qty">
            <span class="qty-number">{{ summary.stock_status.quantity }}</span>
            <span class="text-muted text-sm">sản phẩm còn lại</span>
          </div>
          <div class="qty-selector" v-if="summary.stock_status.available">
            <button class="qty-btn" @click="qty > 1 ? qty-- : null" :disabled="qty <= 1">-</button>
            <input v-model.number="qty" type="number" min="1" max="summary.stock_status.quantity" class="qty-input">
            <button class="qty-btn" @click="qty < summary.stock_status.quantity ? qty++ : null">+</button>
            <button class="btn btn-primary w-full ml-2" @click="addToCart" :disabled="adding">
              🛒 {{ adding ? 'Đang thêm...' : 'Thêm vào giỏ' }}
            </button>
          </div>
          <button v-else class="btn btn-secondary w-full" disabled>Tạm hết hàng</button>
        </div>

        <!-- Category Info -->
        <div class="card">
          <h3 class="font-semibold mb-2">🏷️ Thông tin danh mục</h3>
          <div class="category-detail">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-muted">Tên</span>
              <span>{{ summary.category.name }}</span>
            </div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-muted">ID</span>
              <span>#{{ summary.category.id }}</span>
            </div>
            <div class="text-sm">
              <span class="text-muted">Mô tả</span>
              <p class="mt-1">{{ summary.category.info }}</p>
            </div>
          </div>
        </div>

        <!-- Rating Summary -->
        <div class="card" v-if="summary.reviews.length">
          <h3 class="font-semibold mb-2">⭐ Tổng quan đánh giá</h3>
          <div class="rating-avg">
            <span class="rating-number">{{ avgRating.toFixed(1) }}</span>
            <div>
              <div class="stars-row">
                <span v-for="n in 5" :key="n" class="star" :class="{ empty: n > Math.round(avgRating) }">★</span>
              </div>
              <span class="text-xs text-muted">{{ summary.reviews.length }} đánh giá</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const summary = ref(null)
const loading = ref(true)
const error = ref('')
const qty = ref(1)
const adding = ref(false)

const EMOJIS = {
  'shirt': '👕', 't-shirt': '👕', 'clothing': '👗',
  'sneaker': '👟', 'shoe': '👟', 'footwear': '👟',
  'mug': '☕', 'coffee': '☕', 'home': '🏠',
}
const getEmoji = (name) => {
  if (!name) return '📦'
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(EMOJIS)) {
    if (lower.includes(key)) return emoji
  }
  return '📦'
}

const formatTime = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleString('vi-VN')
}

const avgRating = computed(() => {
  if (!summary.value?.reviews?.length) return 0
  const sum = summary.value.reviews.reduce((a, r) => a + r.stars, 0)
  return sum / summary.value.reviews.length
})

import { useCartStore } from '../stores/cart'

const cartStore = useCartStore()

const addToCart = async () => {
  adding.value = true
  try {
    await cartStore.addItem(Number(route.params.id), qty.value)
    alert(`Đã thêm ${qty.value} sản phẩm vào giỏ!`)
    qty.value = 1
  } catch (err) {
    alert('Thêm giỏ thất bại: ' + err.message)
  } finally {
    adding.value = false
  }
}

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await axios.get(`/api/bff/summary?product_id=${id}`, {
      headers: auth.authHeaders
    })
    summary.value = res.data
  } catch (err) {
    const status = err.response?.status
    const msg = err.response?.data?.trim() || err.message
    if (status >= 400 && status < 600 || msg.includes('stock') || msg.includes('404') || msg.includes('failed') || msg.includes('upstream')) {
      error.value = 'Sản phẩm không tồn tại hoặc tạm thời không khả dụng. Vui lòng thử sản phẩm khác.'
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.qty-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}
.qty-btn {
  width: 40px;
  height: 40px;
  border: 2px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.qty-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.2);
}
.qty-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.qty-input {
  width: 60px;
  height: 40px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  color: var(--text-primary);
  font-weight: 700;
  text-align: center;
  font-size: 1rem;
}
.qty-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
}
.loading-state {
  text-align: center;
  padding: 5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 900px) {
  .detail-layout { grid-template-columns: 1fr; }
}

.product-hero {
  display: flex;
  gap: 1.5rem;
  padding: 0;
  overflow: hidden;
}

.product-hero-image {
  background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1));
  min-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(255,255,255,0.05);
}
.hero-emoji { font-size: 5rem; }

.product-hero-body { padding: 1.5rem; flex: 1; }

.product-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #f0f4ff, #c4c8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.price-tag {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.product-meta-row {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.meta-label { font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; }
.meta-value { font-size: 0.875rem; font-weight: 600; }

/* Reviews */
.reviews-list { display: flex; flex-direction: column; gap: 1rem; }
.review-item {
  padding: 1rem;
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius);
  border: 1px solid rgba(255,255,255,0.05);
}
.review-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.reviewer-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700; color: white; flex-shrink: 0;
}
.reviewer-name { font-weight: 600; font-size: 0.875rem; }
.review-stars { display: flex; gap: 2px; }
.review-text { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0; }

/* Sidebar */
.stock-card { padding: 1.5rem; }
.stock-status {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.stock-status.available { background: var(--success-bg); color: var(--success); }
.stock-status.unavailable { background: var(--danger-bg); color: var(--danger); }
.stock-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.stock-qty {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.qty-number {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #f0f4ff, var(--accent-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Rating summary */
.rating-avg {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.rating-number {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--warning), #d97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stars-row { display: flex; gap: 2px; margin-bottom: 0.25rem; }
</style>
