// app/error.tsx
//
// Ini "jaring pengaman" terakhir — kalau ada error yang tidak sengaja
// tidak ditangani di mana pun (misal query database gagal total, bug
// yang lolos dari testing), user akan melihat halaman ini alih-alih
// layar putih kosong atau crash mentah ala Next.js dev mode.
//
// WAJIB "use client" — error boundary di Next.js App Router hanya bisa
// berupa Client Component.

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Di production, baris ini idealnya dikirim ke layanan monitoring
    // error seperti Sentry — untuk sekarang cukup log ke console server.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
      <p className="mt-2 text-gray-600">
        Maaf, ada yang tidak beres. Coba muat ulang halaman ini.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-md bg-black px-6 py-2 text-sm text-white"
      >
        Coba Lagi
      </button>
    </div>
  );
}