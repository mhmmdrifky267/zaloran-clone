// app/(shop)/store/[sellerId]/page.tsx

import { notFound } from "next/navigation";
import {
  getSellerProfile,
  getStoreProducts,
} from "@/services/product.service";
import { ProductCard } from "@/components/product/ProductCard";

export default async function StorePage({
  params,
}: {
  params: Promise<{ sellerId: string }>;
}) {
  const { sellerId } = await params;

  const [seller, products] = await Promise.all([
    getSellerProfile(sellerId),
    getStoreProducts(sellerId),
  ]);

  if (!seller) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Header profil toko */}
      <div className="mb-8 flex items-center gap-4 border-b pb-6">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
          {seller.storeLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={seller.storeLogo}
              alt={seller.storeName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-bold text-gray-400">
              {seller.storeName.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">{seller.storeName}</h1>
          {seller.description && (
            <p className="mt-1 text-sm text-gray-600">{seller.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {seller._count.products} produk
          </p>
        </div>
      </div>

      {/* Daftar produk toko */}
      {products.length === 0 ? (
        <p className="text-gray-500">Toko ini belum punya produk.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              imageUrl={product.images[0]?.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}