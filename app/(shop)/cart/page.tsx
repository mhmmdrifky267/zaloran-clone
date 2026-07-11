// app/(shop)/cart/page.tsx
//
// Ini Client Component ("use client") — beda dengan halaman katalog/detail
// yang Server Component. Kenapa? Karena isi cart harus terasa instan saat
// diubah (ubah qty, hapus item) tanpa reload halaman. Data cart juga milik
// user yang sedang login, jadi tidak perlu di-cache/SEO seperti katalog.

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";

export default function CartPage() {
  const router = useRouter();
  const { items, totalPrice, isLoading, fetchCart, updateQty, removeItem } =
    useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (isLoading && items.length === 0) {
    return <div className="mx-auto max-w-3xl py-10">Memuat keranjang...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-gray-500">Keranjang kamu masih kosong.</p>
        <Link href="/products" className="mt-4 inline-block text-blue-600">
          Mulai belanja →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-10">
      <h1 className="mb-6 text-2xl font-bold">Keranjang Belanja</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 rounded-md border p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.variant.product.images[0]?.url}
              alt={item.variant.product.name}
              className="h-20 w-20 rounded-md object-cover"
            />

            <div className="flex-1">
              <Link
                href={`/products/${item.variant.product.slug}`}
                className="font-medium hover:underline"
              >
                {item.variant.product.name}
              </Link>
              <p className="text-sm text-gray-500">
                {[item.variant.size, item.variant.color]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              <p className="mt-1 font-semibold">
                Rp{item.variant.product.price.toLocaleString("id-ID")}
              </p>

              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => updateQty(item.id, item.qty - 1)}
                  className="h-7 w-7 rounded-md border"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.qty}</span>
                <button
                  onClick={() => updateQty(item.id, item.qty + 1)}
                  disabled={item.qty >= item.variant.stock}
                  className="h-7 w-7 rounded-md border disabled:opacity-40"
                >
                  +
                </button>

                <button
                  onClick={() => removeItem(item.id)}
                  className="ml-4 text-sm text-red-600"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t pt-4">
        <p className="text-lg font-semibold">
          Total: Rp{totalPrice.toLocaleString("id-ID")}
        </p>
        <button
          onClick={() => router.push("/checkout")}
          className="rounded-md bg-black px-6 py-2 text-white"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}