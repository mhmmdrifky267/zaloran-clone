// app/(shop)/products/page.tsx
//
// Kenapa filter pakai URL query params (?search=...&sort=...), bukan
// useState di client? Karena ini Server Component — filternya diproses
// di server, hasilnya SEO-friendly, dan usernya bisa share link hasil
// pencarian ke orang lain (link-nya sudah "mengingat" filter yang dipilih).

import { getPublicProducts } from "@/services/product.service";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";

type SearchParams = {
  search?: string;
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams; // Next.js 15+: searchParams adalah Promise

  const { products, totalPages, currentPage } = await getPublicProducts({
    search: params.search,
    categorySlug: params.category,
    sort: params.sort,
    page: params.page ? Number(params.page) : 1,
  });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Semua Produk</h1>

      {/* Form filter — pakai GET biasa, tidak perlu JavaScript sama sekali.
          Mobile: search full-width sendiri, kategori+sort dibagi 2 kolom sama
          rata, tombol full-width di bawah. Desktop (sm+): semua sejajar satu baris. */}
      <form
        className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
        action="/products"
      >
        <input
          name="search"
          defaultValue={params.search}
          placeholder="Cari produk..."
          className="w-full rounded-md border px-3 py-2 text-sm sm:flex-1"
        />

        <div className="grid grid-cols-2 gap-2 sm:contents">
          <select
            name="category"
            defaultValue={params.category ?? ""}
            className="w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={params.sort ?? "newest"}
            className="w-full rounded-md border px-3 py-2 text-sm sm:w-auto"
          >
            <option value="newest">Terbaru</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white sm:w-auto"
        >
          Terapkan
        </button>
      </form>

      {products.length === 0 ? (
        <p className="text-sm text-gray-500">Tidak ada produk yang cocok.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              imageUrl={product.images[0]?.url}
              storeName={product.seller.storeName}
            />
          ))}
        </div>
      )}

      {/* Pagination sederhana */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={{
                pathname: "/products",
                query: { ...params, page: p },
              }}
              className={`rounded-md border px-3 py-1 text-sm ${
                p === currentPage ? "bg-black text-white" : ""
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}