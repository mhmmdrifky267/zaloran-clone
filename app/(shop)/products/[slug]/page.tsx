// app/(shop)/products/[slug]/page.tsx

import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getRelatedProducts,
  getStoreProducts,
} from "@/services/product.service";
import { ProductGallery } from "@/components/product/ProductGallery";
import { VariantSelector } from "@/components/product/VariantSelector";
import { ProductCard } from "@/components/product/ProductCard";
import { StoreSection } from "@/components/product/StoreSection";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const [relatedProducts, storeProducts] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getStoreProducts(product.sellerId, product.id),
  ]);

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
        product.reviews.length
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <p className="mt-1 text-sm text-gray-500">
            {product.category.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{product.name}</h1>

          {avgRating && (
            <p className="mt-2 text-sm">
              ⭐ {avgRating.toFixed(1)} ({product.reviews.length} ulasan)
            </p>
          )}

          <p className="mt-4 text-2xl font-semibold">
            Rp{product.price.toLocaleString("id-ID")}
          </p>

          <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
            {product.description}
          </p>

          <div className="mt-6">
            <VariantSelector variants={product.variants} />
          </div>
        </div>
      </div>

      {/* ---- Section Toko ---- */}
      <StoreSection
        sellerId={product.sellerId}
        storeName={product.seller.storeName}
        storeLogo={product.seller.storeLogo}
        products={storeProducts}
      />

      {/* ---- Ulasan ---- */}
      {product.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Ulasan Pembeli</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{review.user.name}</p>
                  <p className="text-sm">{"⭐".repeat(review.rating)}</p>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-gray-600">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Rekomendasi ---- */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-bold">Produk Serupa</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                slug={related.slug}
                name={related.name}
                price={related.price}
                imageUrl={related.images[0]?.url}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}