// components/product/PayAgainButton.tsx
//
// Dipakai di halaman detail pesanan untuk order yang masih PENDING (popup
// Snap sebelumnya ditutup / token kedaluwarsa). Minta token Snap BARU lewat
// /api/payment/retry (order_id lama sudah "terpakai" di Midtrans, jadi tidak
// bisa dipakai ulang begitu saja), lalu buka popup pembayaran lagi.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export function PayAgainButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    const res = await fetch("/api/payment/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Gagal membuat sesi pembayaran baru");
      return;
    }

    window.snap.pay(data.snapToken, {
      onSuccess: () => router.refresh(),
      onPending: () => router.refresh(),
      onError: () => setError("Pembayaran gagal, silakan coba lagi"),
      onClose: () => router.refresh(),
    });
  }

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
      <button onClick={handleClick} disabled={loading} className="btn btn-primary w-full">
        {loading ? "Menyiapkan pembayaran..." : "Bayar Lagi"}
      </button>
      {error && (
        <p className="mt-2 font-mono text-[11px]" style={{ color: "var(--stamp-red)" }}>
          {error}
        </p>
      )}
    </>
  );
}
