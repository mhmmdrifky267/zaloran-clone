// components/product/VariantSelector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";

type Variant = {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
};

export function VariantSelector({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);

  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selected = variants.find((v) => v.id === selectedId);

  async function handleAddToCart() {
    if (!selected) return;
    setStatus("loading");
    setErrorMsg(null);

    const success = await addItem(selected.id, qty);

    if (success) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    const storeError = useCartStore.getState().error;

    if (storeError === "Tidak diizinkan") {
      // Belum login — arahkan ke halaman login
      router.push("/login");
      return;
    }

    setStatus("error");
    setErrorMsg(storeError ?? "Gagal menambahkan ke keranjang.");
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium">Pilih Varian</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const label = [variant.size, variant.color].filter(Boolean).join(" / ");
          const isOutOfStock = variant.stock === 0;

          return (
            <button
              key={variant.id}
              disabled={isOutOfStock}
              onClick={() => {
                setSelectedId(variant.id);
                setQty(1);
              }}
              className={`rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                selectedId === variant.id
                  ? "border-black bg-black text-white"
                  : "border-gray-300"
              }`}
            >
              {label || "Default"}
            </button>
          );
        })}
      </div>

      {selected && (
        <>
          <p className="mt-2 text-xs text-gray-500">
            {selected.stock > 0
              ? `Stok tersedia: ${selected.stock}`
              : "Stok habis"}
          </p>

          {/* Pengatur jumlah */}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-md border"
            >
              −
            </button>
            <span className="w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(selected.stock, q + 1))}
              className="h-8 w-8 rounded-md border"
            >
              +
            </button>
          </div>
        </>
      )}

      {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
      {status === "success" && (
        <p className="mt-2 text-sm text-green-600">
          Berhasil ditambahkan ke keranjang!
        </p>
      )}

      <button
        onClick={handleAddToCart}
        disabled={!selected || selected.stock === 0 || status === "loading"}
        className="mt-4 w-full rounded-md bg-black py-2 text-white disabled:opacity-40"
      >
        {status === "loading" ? "Menambahkan..." : "Tambah ke Keranjang"}
      </button>
    </div>
  );
}