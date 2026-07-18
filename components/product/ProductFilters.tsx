// components/product/ProductFilters.tsx
//
// Menggantikan form filter lama (search+kategori+sort+tombol sejajar, yang
// terasa berantakan di mobile). Sekarang: search bar + SATU tombol "Atur"
// yang membuka panel — di mobile jadi bottom-sheet (nempel di bawah layar,
// pola yang sudah familiar buat user dari app e-commerce), di desktop jadi
// dropdown kecil di bawah tombolnya.

"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

type Category = { id: string; name: string; slug: string };

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_desc", label: "Harga Tinggi ke Rendah" },
  { value: "price_asc", label: "Harga Rendah ke Tinggi" },
  { value: "discount", label: "Diskon Terbesar" },
];

export function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  // Inisialisasi SEKALI dari URL saat mount — tidak perlu useEffect untuk
  // "menyinkronkan ulang" tiap URL berubah, karena parent (page-products.tsx)
  // yang me-remount komponen ini via prop `key` setiap URL berubah dari luar.
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [category, setCategory] = useState(() => searchParams.get("category") ?? "");
  const [sort, setSort] = useState(() => searchParams.get("sort") ?? "newest");

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    const merged = { search, category, sort, ...overrides };

    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete("promo"); // filter manual keluar dari mode "promo" khusus
    params.delete("page"); // reset ke halaman 1 tiap filter berubah

    return `${pathname}?${params.toString()}`;
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({}));
  }

  function handleApplyFilters() {
    router.push(buildUrl({}));
    setOpen(false);
  }

  function handleReset() {
    setCategory("");
    setSort("newest");
    router.push(pathname);
    setOpen(false);
  }

  const activeCount = (category ? 1 : 0) + (sort !== "newest" ? 1 : 0);

  return (
    <div className="relative mb-6">
      <div className="flex gap-2">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--gray)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full py-2.5 pl-9 pr-3 text-sm"
            style={{ border: "1px solid var(--line)", borderRadius: "3px" }}
          />
        </form>

        <button
          onClick={() => setOpen(true)}
          className="tag tag-ghost whitespace-nowrap"
          style={{ paddingLeft: "12px" }}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Atur
          {activeCount > 0 && (
            <span
              className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] text-white"
              style={{ background: "var(--stamp-red)" }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <>
          {/* Overlay klik-di-luar-untuk-tutup — SELALU aktif (desktop & mobile),
              tapi cuma keliatan gelap di mobile (bottom sheet butuh backdrop jelas).
              Di desktop tetap transparan, cukup buat "menangkap klik" di luar
              panel supaya dropdown bisa ditutup tanpa harus pencet tombol X. */}
          <div
            className="fixed inset-0 z-60 bg-black/40 sm:bg-transparent"
            onClick={() => setOpen(false)}
          />

          <div
            className="fixed inset-x-0 bottom-0 z-61 max-h-[75vh] overflow-y-auto rounded-t-lg p-5 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-none sm:w-80 sm:rounded-md sm:p-4"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              boxShadow: "0 16px 40px -12px rgba(22,23,26,0.35)",
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[15px] font-bold">Atur</span>
              <button onClick={() => setOpen(false)} aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="field">
              <label>Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-2">
              <label
                className="font-mono mb-2 block text-[10px] uppercase tracking-wide"
                style={{ color: "var(--gray)" }}
              >
                Urutkan
              </label>
              <div className="space-y-1">
                {SORT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 py-1.5 text-[13px]"
                  >
                    <input
                      type="radio"
                      name="sort"
                      checked={sort === opt.value}
                      onChange={() => setSort(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={handleReset} className="btn btn-outline flex-1">
                Reset
              </button>
              <button onClick={handleApplyFilters} className="btn btn-primary flex-1">
                Terapkan
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}