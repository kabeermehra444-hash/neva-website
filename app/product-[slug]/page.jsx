import { notFound } from 'next/navigation';
import ProductContent from './product-content';

export default async function ProductPage({ params }) {
  const { slug } = await params;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return notFound();
    }

    const products = await response.json();
    const product = products.find((p) => p.slug === slug);

    if (!product) {
      return notFound();
    }

    return <ProductContent product={product} />;
  } catch (error) {
    console.error('Error fetching product:', error);
    return notFound();
  }
}
