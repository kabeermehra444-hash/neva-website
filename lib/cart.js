'use client';

// ============================================================
// CLUB NEVA - SINGLE CART SOURCE OF TRUTH
// All cart reads/writes must go through these functions.
// Dispatches 'neva:cartUpdated' custom event so ALL open
// tabs/components can react immediately (same-tab + cross-tab).
// ============================================================

const CART_KEY = 'neva_cart';

export function getCartItems() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCartItems(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  // Fire custom event so same-tab listeners react immediately
  window.dispatchEvent(new CustomEvent('neva:cartUpdated', { detail: { items } }));
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + (item.quantity || 1), 0);
}

export function getCartSubtotal() {
  return getCartItems().reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

export function addToCart(product) {
  const items = getCartItems();
  const size = product.size || 'One Size';
  const idx = items.findIndex(i => i.id === product.id && i.size === size);

  if (idx >= 0) {
    items[idx].quantity = (items[idx].quantity || 1) + 1;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      size,
      quantity: 1,
      image: product.image || product.image_url || null,
    });
  }

  saveCartItems(items);
  return items;
}

export function updateCartItemQuantity(id, size, newQty) {
  let items = getCartItems();
  if (newQty <= 0) {
    items = items.filter(i => !(i.id === id && i.size === size));
  } else {
    const idx = items.findIndex(i => i.id === id && i.size === size);
    if (idx >= 0) items[idx].quantity = newQty;
  }
  saveCartItems(items);
  return items;
}

export function removeCartItem(id, size) {
  const items = getCartItems().filter(i => !(i.id === id && i.size === size));
  saveCartItems(items);
  return items;
}

export function clearCart() {
  saveCartItems([]);
}

// React hook - returns live cartCount that updates on cart changes
import { useState, useEffect } from 'react';

export function useCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getCartCount());

    const update = () => setCount(getCartCount());
    window.addEventListener('neva:cartUpdated', update);
    window.addEventListener('storage', (e) => { if (e.key === CART_KEY) update(); });

    return () => {
      window.removeEventListener('neva:cartUpdated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return count;
}
