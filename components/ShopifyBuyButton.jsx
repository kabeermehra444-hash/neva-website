'use client';
import { useEffect, useRef } from 'react';

const DOMAIN = '5qjaik-t1.myshopify.com';
const TOKEN = '0c9a55caa97028ef0398f4e685adf6a4';
const SDK_SRC = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';

function loadSDK() {
  return new Promise((resolve) => {
    if (window.ShopifyBuy && window.ShopifyBuy.UI) { resolve(); return; }
    if (document.querySelector(`script[src="${SDK_SRC}"]`)) {
      // Script tag exists but hasn't fired onload yet — poll
      const poll = setInterval(() => {
        if (window.ShopifyBuy && window.ShopifyBuy.UI) { clearInterval(poll); resolve(); }
      }, 50);
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_SRC;
    s.async = true;
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

export default function ShopifyBuyButton({ productId }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!productId || !ref.current) return;
    let cancelled = false;
    let component = null;

    (async () => {
      await loadSDK();
      if (cancelled || !ref.current) return;

      const client = window.ShopifyBuy.buildClient({ domain: DOMAIN, storefrontAccessToken: TOKEN });
      const ui = await window.ShopifyBuy.UI.onReady(client);
      if (cancelled || !ref.current) return;

      component = await ui.createComponent('product', {
        id: productId,
        node: ref.current,
        options: {
          product: {
            styles: {
              product: {
                'font-family': 'inherit',
              },
              button: {
                'font-family': 'inherit',
                'font-size': '13px',
                'padding-top': '20px',
                'padding-bottom': '20px',
                'padding-left': '0',
                'padding-right': '0',
                width: '100%',
                'font-weight': '700',
                'letter-spacing': '0.1em',
                'text-transform': 'uppercase',
                'border-radius': '12px',
                'background-color': '#000000',
                color: '#ffffff',
                ':hover': { 'background-color': '#374151' },
                ':focus': { 'background-color': '#374151' },
              },
              price: {
                'font-size': '28px',
                'font-weight': '700',
                color: '#111827',
                'margin-bottom': '0',
              },
              compareAtPrice: {
                color: '#9ca3af',
              },
            },
            // Go straight to Shopify checkout — no cart step
            buttonDestination: 'checkout',
            layout: 'vertical',
            contents: {
              img: false,         // Page has its own image area
              title: false,       // Page shows the product name
              price: true,
              options: true,      // Size / color variant selector
              quantity: true,
              quantityIncrement: true,
              quantityDecrement: true,
              quantityInput: true,
              button: true,
            },
            text: {
              button: 'Buy Now',
              outOfStock: 'Coming Soon',
              unavailable: 'Coming Soon',
            },
          },
          // Hide the cart toggle icon — not needed with direct checkout
          toggle: {
            styles: {
              toggle: { 'background-color': '#000000' },
              count: { color: '#ffffff' },
              iconPath: { fill: '#ffffff' },
            },
          },
          cart: {
            styles: {
              button: {
                'font-family': 'inherit',
                'font-size': '13px',
                'letter-spacing': '0.1em',
                'text-transform': 'uppercase',
                'background-color': '#000000',
                ':hover': { 'background-color': '#374151' },
              },
            },
          },
        },
      });
    })().catch(console.error);

    return () => {
      cancelled = true;
      if (component) component.destroy();
    };
  }, [productId]);

  return <div ref={ref} className="w-full" />;
}
