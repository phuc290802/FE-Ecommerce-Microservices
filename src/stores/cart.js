import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from './auth.js'

export const useCartStore = defineStore('cart', () => {
  const auth = useAuthStore()
  const cart = ref({ items: [], total: 0 })
  const loading = ref(false)
  const error = ref('')
  const cartKey = ref('')

  const getCartKey = () => {
    if (auth.isLoggedIn) {
      return String(auth.userId || Date.now()) // TODO: sync with backend user_id
    }
    return localStorage.getItem('guestCartId') || ('guest_' + Date.now())
  }

  const fetchCart = async () => {
    cartKey.value = getCartKey()
    loading.value = true
    error.value = ''
    try {
      const res = await axios.get(`/api/cart?cart_key=${cartKey.value}`, { 
        headers: auth.authHeaders 
      })
      cart.value = res.data
      if (!auth.isLoggedIn) localStorage.setItem('guestCartId', cartKey.value)
    } catch (err) {
      error.value = err.response?.data || 'Failed to load cart'
    } finally {
      loading.value = false
    }
  }

  const addItem = async (productId, quantity = 1, variant = null) => {
    try {
      cartKey.value = getCartKey()
      await axios.post('/api/cart', {
        cart_key: cartKey.value,
        product_id: productId,
        quantity,
        variant
      }, { headers: auth.authHeaders })
      await fetchCart()
    } catch (err) {
      throw new Error(err.response?.data || 'Add to cart failed')
    }
  }

  const updateItemQty = async (itemId, qty) => {
    try {
      await axios.put(`/api/cart/item/${itemId}`, { quantity: qty }, { headers: auth.authHeaders })
      await fetchCart()
    } catch (err) {
      throw new Error('Update failed')
    }
  }

  const removeItem = async (itemId) => {
    try {
      await axios.delete(`/api/cart/item/${itemId}`, { headers: auth.authHeaders })
      await fetchCart()
    } catch (err) {
      throw new Error('Remove failed')
    }
  }

  const clearCart = async () => {
    try {
      await axios.post(`/api/cart/clear?cart_key=${cartKey.value}`, {}, { headers: auth.authHeaders })
      await fetchCart()
      if (!auth.isLoggedIn) localStorage.removeItem('guestCartId')
    } catch (err) {
      throw new Error('Clear failed')
    }
  }

  const cartCount = computed(() => cart.value.items.reduce((sum, i) => sum + i.quantity, 0))

  return {
    cart, loading, error, cartKey, cartCount,
    fetchCart, addItem, updateItemQty, removeItem, clearCart, getCartKey
  }
})

