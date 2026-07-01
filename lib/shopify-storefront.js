const DOMAIN = '5qjaik-t1.myshopify.com';
const TOKEN = '0c9a55caa97028ef0398f4e685adf6a4';
const ENDPOINT = `https://${DOMAIN}/api/2024-01/graphql.json`;

/**
 * Fetches featuredImage.url for each product ID (numeric strings).
 * Returns a map of { [numericId]: urlString | null }.
 * Products with no image uploaded return null — callers should show a placeholder.
 */
export async function fetchProductImages(numericIds) {
  const gids = numericIds.map(id => `gid://shopify/Product/${id}`);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({
      query: `
        query GetProductImages($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on Product {
              id
              featuredImage { url }
            }
          }
        }
      `,
      variables: { ids: gids },
    }),
  });

  const { data } = await res.json();

  const map = {};
  for (const node of (data?.nodes ?? [])) {
    if (!node) continue;
    const numericId = node.id.replace('gid://shopify/Product/', '');
    map[numericId] = node.featuredImage?.url ?? null;
  }
  return map;
}
