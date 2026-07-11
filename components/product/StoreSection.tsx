// components/product/StoreSection.tsx

import Link from "next/link";
import { ProductCard } from "./ProductCard";

type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: { url: string }[];
};

type StoreSectionProps = {
  sellerId: string;
  storeName: string;
  storeLogo?: string | null;
  products: StoreProduct[];
};

export function StoreSection({
  sellerId,
  storeName,
  storeLogo,
  products,
}: StoreSectionProps) {
  return (
    <div className="mt-12 rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <Link href={`/store/${sellerId}`} className="flex items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-100">
            {storeLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storeLogo}
                alt={storeName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-bold text-gray-400">
                {storeName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold">{storeName}</p>
            <p className="text-xs text-gray-500">Lihat profil toko</p>
          </div>
        </Link>

        <Link
          href={`/store/${sellerId}`}
          className="rounded-md border px-4 py-1.5 text-sm hover:bg-gray-50"
        >
          Kunjungi Toko
        </Link>
      </div>

      {products.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-sm font-medium text-gray-600">
            Produk lain dari toko ini
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        </div>
      )}
    </div>
  );
}