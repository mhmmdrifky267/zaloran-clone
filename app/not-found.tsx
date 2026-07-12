// app/not-found.tsx
//
// Next.js otomatis memakai file ini setiap kali notFound() dipanggil
// (seperti di halaman detail produk kalau slug-nya tidak ketemu),
// atau setiap kali user buka URL yang memang tidak ada route-nya.

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-gray-600">Halaman yang kamu cari tidak ditemukan.</p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-black px-6 py-2 text-sm text-white"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}