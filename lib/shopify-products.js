// ─── Shopify product catalog ─────────────────────────────────────────────────
// id        : numeric Shopify product ID — used by ShopifyBuyButton SDK
// slug      : Shopify handle — used as /product/[slug] URL path
// name      : display name shown on the site
// category  : used for filter chips on /shop
// image_url : null until photos are uploaded to Shopify
//             To add an image: paste the Shopify CDN URL as the image_url value.
//             Format: 'https://cdn.shopify.com/s/files/1/XXXX/XXXX/products/filename.jpg'
// ─────────────────────────────────────────────────────────────────────────────

export const SHOPIFY_PRODUCTS = [
  {
    id: '15072260424043',
    slug: 'colony-skirt',
    name: 'Colony Skirt',
    category: 'Bottoms',
    image_url: null, // ← paste Shopify CDN URL here once uploaded
  },
  {
    id: '15072259473771',
    slug: 'core-shorts',
    name: 'Core Shorts',
    category: 'Bottoms',
    image_url: null, // ← paste Shopify CDN URL here once uploaded
  },
  {
    id: '15072259047787',
    slug: 'dawn-dress',
    name: 'Dawn Dress',
    category: 'Dresses',
    image_url: null, // ← paste Shopify CDN URL here once uploaded
  },
  {
    id: '15072259801451',
    slug: 'genesis-shirt',   // Shopify handle — URL will be /product/genesis-shirt
    name: 'Genesis Tank',
    category: 'Tops',
    image_url: null, // ← paste Shopify CDN URL here once uploaded
  },
  {
    id: '15072260686187',
    slug: 'heritage-hat',
    name: 'Heritage Hat',
    category: 'Accessories',
    image_url: null, // ← paste Shopify CDN URL here once uploaded
    soldOut: true,
  },
  {
    id: '15072260489579',
    slug: 'hive-tee',
    name: 'Hive Tee',
    category: 'Tops',
    image_url: null, // ← paste Shopify CDN URL here once uploaded
  },
];
