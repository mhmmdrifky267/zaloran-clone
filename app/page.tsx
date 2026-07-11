// app/page.tsx
//
// SEMENTARA: halaman utama belum kita bangun (itu jadwalnya di tahap
// homepage & rekomendasi produk, belakangan). Daripada tampilan default
// Next.js yang membingungkan, kita arahkan langsung ke /login dulu.
// Nanti kalau homepage sudah jadi, redirect ini kita hapus/ganti.

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}