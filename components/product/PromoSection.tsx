// components/product/PromoSection.tsx
//
// Section ini SENGAJA dikasih identitas visual beda (background gelap +
// aksen merah) dari section lain di homepage — supaya langsung kelihatan
// beda dan menarik perhatian, pola umum di e-commerce (Shopee/Zalora selalu
// kasih section flash sale/promo warna kontras).

import Link from "next/link";
import { ProductCard } from "./ProductCard";

type PromoProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  discountPercent: number;
  createdAt: Date;
  images: { url: string }[];
  seller: { storeName: string };
};

export function PromoSection({ products }: { products: PromoProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section
      className="relative mb-12 overflow-hidden rounded-md px-4 py-6 sm:px-6 sm:py-8"
      style={{ background: "var(--ink)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative mb-5 flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="stamp"
            style={{ color: "#fff", borderColor: "#fff", background: "transparent" }}
          >
            Promo
          </span>
          <span className="font-display text-[16px] font-extrabold tracking-tight text-white">
            Lagi Diskon
          </span>
        </div>
        <Link
          href="/products?promo=1"
          className="see-all"
          style={{ color: "var(--stamp-red)" }}
        >
          Lihat Lainnya →
        </Link>
      </div>

      {/* Scroll horizontal di mobile (lebih hemat tempat vertikal & terasa
          seperti carousel promo di app e-commerce), grid biasa di desktop */}
      <div className="scroll-rail relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5">
        {products.map((product) => (
          <div key={product.id} className="w-[42%] shrink-0 sm:w-auto">
            <ProductCard
              slug={product.slug}
              name={product.name}
              price={product.price}
              discountPercent={product.discountPercent}
              createdAt={product.createdAt}
              imageUrl={product.images[0]?.url}
              storeName={product.seller.storeName}
            />
          </div>
        ))}
      </div>
    </section>
  );
}