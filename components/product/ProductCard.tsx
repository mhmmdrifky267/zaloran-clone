// components/product/ProductCard.tsx
//
// Server Component murni (tidak ada "use client") — tidak butuh interaksi,
// cuma menampilkan data. Ini membuatnya ringan: nol JavaScript dikirim
// ke browser untuk komponen ini.

import Link from "next/link";

type ProductCardProps = {
  slug: string;
  name: string;
  price: number;
  imageUrl?: string;
  storeName?: string;
};

export function ProductCard({
  slug,
  name,
  price,
  imageUrl,
  storeName,
}: ProductCardProps) {
  return (
    <Link
      href={`/products/${slug}`}
      className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md active:scale-[0.98]"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            Tidak ada gambar
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3">
        <p className="line-clamp-2 text-xs leading-snug text-gray-700 sm:text-sm">
          {name}
        </p>
        <p className="mt-1 text-sm font-bold text-gray-900 sm:text-base">
          Rp{price.toLocaleString("id-ID")}
        </p>
        {storeName && (
          <p className="mt-0.5 truncate text-[11px] text-gray-400 sm:text-xs">
            {storeName}
          </p>
        )}
      </div>
    </Link>
  );
}