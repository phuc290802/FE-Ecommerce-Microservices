<template>
  <div class="page-container">
    <div class="section-header">
      <h1 class="page-title">🛒 Giỏ hàng</h1>
      <p class="page-subtitle">Xem lại và quản lý sản phẩm trong giỏ</p>
    </div>

    <!-- Loading/Error -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải giỏ hàng...</p>
    </div>
    <div v-else-if="error" class="alert alert-error">
      {{ error }}
      <button class="btn btn-sm btn-secondary ml-auto" @click="loadCart">Thử lại</button>
    </div>

    <!-- Empty Cart -->
    <div v-else-if="!cart.items?.length" class="empty-state">
      <div class="empty-icon">🛒</div>
      <h3>Giỏ hàng trống</h3>
      <p>Thêm sản phẩm từ trang chi tiết để bắt đầu mua sắm</p>
      <router-link to="/products" class="btn btn-primary">
        Khám phá sản phẩm →
      </router-link>
    </div>

    <!-- Cart Items -->
    <div v-else class="cart-content">
      <div class="cart-items">
        <div v-for="item in cart.items" :key="item.id" class="cart-item card">
          <div class="cart-item-main">
            <div class="product-preview">
              <span class="product-emoji">{{ getEmoji(item.product_id) }}</span>
              <div>
                <h3 class="product-name">Sản phẩm #{{ item.product_id }}</h3>
                <div class="variant-info" v-if="item.variant">
                  {{ Object.entries(item.variant).map(([k,v]) => `${k}: ${v}`).join(', ') }}
                </div>
              </div>
            </div>
            <div class="price-section">
              <span class="item-total">${{ (item.quantity * avgPrice).toFixed(2) }}</span>
              <span class="unit-price">${{ avgPrice.toFixed(2) }}/sp</span>
            </div>
          </div>
          <div class="cart-item-controls">
            <div class="qty-controls">
              <button class="qty-btn" @click="updateQty(item.id, item.quantity - 1)" :disabled="item.quantity <= 1">-</button>
              <span class="qty-display">{{ item.quantity }}</span>
              <button class="qty-btn" @click="updateQty(item.id, item.quantity + 1)">+</button>
            </div>
            <button class="btn btn-danger btn-sm" @click="removeItem(item.id)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Xóa
            </button>
          </div>
        </div>
      </div>

      <!-- Cart Summary -->
      <div class="cart-summary card">
        <h3>Tổng kết</h3>
        <div class="summary-row">
          <span>Tạm tính:</span>
          <span>${{ cart.total.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>Phí ship:</span>
          <span>0 VNĐ</span>
        </div>
        <div class="summary-total">
          <span>Tổng cộng:</span>
          <strong>${{ cart.total.toFixed(2) }}</strong>
        </div>
        <button class="btn btn-primary w-full checkout-btn" @click="checkout">
          Tiến hành thanh toán
        </button>
        <div class="cart-actions">
          <button class="btn btn-secondary btn-sm" @click="clearCart">Xóa toàn bộ giỏ</button>
          <button class="btn btn-secondary btn-sm" @click="loadCart">Làm mới</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const cart = ref({ items: [], total: 0 })
const loading = ref(false)
const error = ref('')

const EMOJIS = { 1: '👕', 2: '👟', 3: '☕', 4: '👗', 5: '📱', 6: '🏠' }
const getEmoji = (id) => EMOJIS[id] || '📦'

const avgPrice = 29.99  // Mock; real would fetch from product service

const cartKey = computed(() => {
  if (auth.isLoggedIn) return auth.userId?.toString() || 'user_' + auth.userEmail
  return 'guest_' + localStorage.getItem('guestCartId') || Date.now().toString()
})

const loadCart = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get(`/api/cart?cart_key=${cartKey.value}`, { headers: auth.authHeaders })
    cart.value = res.data
    if (!auth.isLoggedIn) localStorage.setItem('guestCartId', cartKey.value)
  } catch (err) {
    error.value = err.response?.data || 'Lỗi tải giỏ hàng'
  } finally {
    loading.value = false
  }
}

const updateQty = async (itemId, qty) => {
  if (qty < 1) return removeItem(itemId)
  try {
    await axios.put(`/api/cart/item/${itemId}`, { quantity: qty }, { headers: auth.authHeaders })
    await loadCart()
  } catch (err) {
    alert('Cập nhật thất bại')
  }
}

const removeItem = async (itemId) => {
  if (!confirm('Xóa sản phẩm này?')) return
  try {
    await axios.delete(`/api/cart/item/${itemId}`, { headers: auth.authHeaders })
    await loadCart()
  } catch (err) {
    alert('Xóa thất bại')
  }
}

const clearCart = async () => {
  if (!confirm('Xóa toàn bộ giỏ hàng?')) return
  try {
    await axios.post(`/api/cart/clear?cart_key=${cartKey.value}`, {}, { headers: auth.authHeaders })
    await loadCart()
  } catch (err) {
    alert('Xóa thất bại')
  }
}

const checkout = () => {
  router.push('/checkout')
}

onMounted(loadCart)
</script>

<style scoped>
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
}
.cart-item-main { flex: 1; }
.product-preview { display: flex; gap: 1rem; align-items: center; }
.product-emoji { font-size: 2.5rem; }
.product-name { font-weight: 700; margin-bottom: 0.25rem; }
.variant-info { font-size: 0.8rem; color: var(--text-secondary); }

.qty-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255,255,255,0.05);
  border-radius: 12px;
  padding: 0.25rem;
}
.qty-btn {
  width: 32px; height: 32px;
  border: none; background: rgba(255,255,255,0.1);
  border-radius: 8px;
  color: var(--text-primary);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.qty-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); }
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.qty-display { min-width: 32px; text-align: center; font-weight: 700; }

.price-section { text-align: right; }
.item-total { 
  font-size: 1.25rem; font-weight: 800; 
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  -webkit-background-clip: text;
}
.unit-price { font-size: 0.8rem; color: var(--text-secondary); }

.cart-summary {
  padding: 1.5rem;
  position: sticky; top: 2rem;
}
.summary-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
.summary-total { 
  margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border);
  font-size: 1.1rem;
}
.summary-total strong { font-size: 1.4rem; color: var(--accent); }
.checkout-btn { 
  height: 48px; font-size: 1rem; font-weight: 700; margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
}
.cart-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
</style>

