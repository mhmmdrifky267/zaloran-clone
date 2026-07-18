// app/page.tsx
//
// Susunan section (dari yang paling "menarik perhatian" ke yang paling umum):
// 1. Hero
// 2. Promo — 10 produk diskon terbesar, identitas visual beda (aksen gelap+merah)
// 3. "Rekomendasi Untukmu" — personal, baca histori lihat (kategori+brand)
// 4. "Dilihat Terakhir" — literal histori lihat user
// 5. "Produk Terlaris" — fallback yang selalu ada buat semua orang

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getRecentlyViewed,
  getPopularProducts,
  getPersonalizedRecommendations,
} from "@/services/recommendation.service";
import { getPromoProducts } from "@/services/product.service";
import { ProductCard } from "@/components/product/ProductCard";
import { PromoSection } from "@/components/product/PromoSection";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [recentlyViewed, popularProducts, categories, promoProducts, personalized] =
    await Promise.all([
      userId ? getRecentlyViewed(userId) : Promise.resolve([]),
      getPopularProducts(),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      getPromoProducts(10),
      userId
        ? getPersonalizedRecommendations(userId)
        : Promise.resolve({ products: [], basisLabel: null }),
    ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      {/* ---- Hero: latar ink, tekstur grid halus, registration marks di sudut
             (motif customs/manifest), stamp + headline + CTA + ringkasan cepat ---- */}
      <div
        className="relative mb-10 overflow-hidden rounded-md px-6 py-10 sm:px-10 sm:py-14"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        {/* corner registration marks — signature motif R.O.X. */}
        <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-white/25 sm:h-4 sm:w-4" />
        <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-white/25 sm:h-4 sm:w-4" />
        <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/25 sm:h-4 sm:w-4" />
        <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/25 sm:h-4 sm:w-4" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg">
            <div className="mb-4 flex items-center gap-3">
              <span
                className="stamp"
                style={{ color: "#fff", borderColor: "#fff", background: "transparent" }}
              >
                Musim Baru
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/50">
                Edisi 004 · Akhir Tahun
              </span>
            </div>
            <p className="font-display text-[32px] font-black leading-[1.05] tracking-tight sm:text-[46px]">
              Koleksi Akhir Tahun,
              <br />
              Untuk Setiap Gaya.
            </p>
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-white/60">
              Kurasi terbaru dari ratusan penjual terpercaya — dikirim dengan manifest
              yang jelas, tanpa drama.
            </p>
            <Link
              href="/products"
              className="tag mt-6 inline-flex text-[12px]"
              style={{ background: "var(--stamp-red)" }}
            >
              Belanja Sekarang →
            </Link>
          </div>

          <dl className="grid grid-cols-3 gap-4 border-t border-white/15 pt-5 sm:w-64 sm:border-t-0 sm:border-l sm:pl-8 sm:pt-0">
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/45">
                Kategori
              </dt>
              <dd className="font-display mt-1 text-lg font-extrabold">{categories.length}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/45">
                Promo
              </dt>
              <dd className="font-display mt-1 text-lg font-extrabold">{promoProducts.length}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/45">
                Terlaris
              </dt>
              <dd className="font-display mt-1 text-lg font-extrabold">{popularProducts.length}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ---- Kategori cepat, gaya tag-ghost ---- */}
      <div className="mb-10 flex flex-wrap gap-2">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="tag tag-ghost"
          >
            {category.name}
          </Link>
        ))}
      </div>

      {/* ---- Promo ---- */}
      <PromoSection products={promoProducts} />

      {/* ---- Rekomendasi Untukmu (personal, baca kategori+brand yang sering dilihat) ---- */}
      {personalized.products.length > 0 && (
        <section className="mb-10">
          <div className="section-title mb-1">
            <span>Rekomendasi Untukmu</span>
            <Link href="/products" className="see-all">
              Lihat Semua
            </Link>
          </div>
          {personalized.basisLabel && (
            <p className="font-mono mb-4 text-[10.5px]" style={{ color: "var(--gray)" }}>
              {personalized.basisLabel}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {personalized.products.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                discountPercent={product.discountPercent}
                createdAt={product.createdAt}
                imageUrl={product.images[0]?.url}
                storeName={product.seller.storeName}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- Dilihat terakhir (hanya untuk user login yang punya histori) ---- */}
      {recentlyViewed.length > 0 && (
        <section className="mb-10">
          <div className="section-title mb-4">
            <span>Dilihat Terakhir</span>
            <Link href="/products" className="see-all">
              Lihat Semua
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentlyViewed.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                discountPercent={product.discountPercent}
                createdAt={product.createdAt}
                imageUrl={product.images[0]?.url}
              />
            ))}
          </div>
        </section>
      )}

      {/* ---- Produk terlaris ---- */}
      <section>
        <div className="section-title mb-4">
          <span>Produk Terlaris</span>
          <Link href="/products" className="see-all">
            Lihat Semua
          </Link>
        </div>
        {popularProducts.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--gray)" }}>
            Belum ada produk.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {popularProducts.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                discountPercent={product.discountPercent}
                createdAt={product.createdAt}
                imageUrl={product.images[0]?.url}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}