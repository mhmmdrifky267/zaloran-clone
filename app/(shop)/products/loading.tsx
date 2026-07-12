// app/(shop)/products/loading.tsx
//
// Next.js otomatis menampilkan file ini SELAMA page.tsx di folder yang
// sama masih menunggu data (Server Component yang "await" Prisma).
// Tanpa file ini, user akan melihat halaman putih kosong selama loading,
// yang terasa seperti "web-nya nge-freeze" — padahal cuma nunggu database.

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mb-8 h-10 w-full animate-pulse rounded bg-gray-100" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border">
            <div className="aspect-square animate-pulse bg-gray-200" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}