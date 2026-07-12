// app/(shop)/loading.tsx
//
// Ditaruh di root folder (shop) — jadi ini jadi FALLBACK untuk semua
// halaman di dalam grup (shop) yang tidak punya loading.tsx sendiri
// (misal /cart, /wishlist, /orders). Halaman yang sudah punya
// loading.tsx spesifik (seperti /products) akan pakai punya sendiri,
// bukan yang ini — Next.js otomatis pilih yang paling dekat/spesifik.

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
        <div className="h-32 w-full animate-pulse rounded bg-gray-100" />
        <div className="h-32 w-full animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}