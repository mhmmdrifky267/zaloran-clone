// app/(shop)/checkout/page.tsx
//
// Alur halaman ini:
// 1. Muat cart (dikelompokkan per toko) + daftar alamat user
// 2. User pilih alamat pengiriman
// 3. Untuk tiap toko, user klik "Cek Ongkir" -> panggil Biteship -> pilih kurir
// 4. Setelah SEMUA toko sudah pilih kurir, tombol "Bayar" aktif
// 5. Klik bayar -> buat Order (satu per toko) -> dapat Snap token per Order
//    -> tampilkan popup pembayaran Midtrans satu per satu

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

type CartGroup = {
  sellerId: string;
  storeName: string;
  itemsTotal: number;
  totalWeight: number;
  items: {
    id: string;
    qty: number;
    variant: {
      size: string | null;
      color: string | null;
      product: {
        name: string;
        price: number;
        weight: number;
        images: { url: string }[];
      };
    };
  }[];
};

type Address = {
  id: string;
  label: string;
  recipient: string;
  phone: string;
  fullAddress: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
};

type CourierRate = {
  courier_name: string;
  courier_service_name: string;
  duration: string;
  price: number;
};

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

export default function CheckoutPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<CartGroup[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Nyimpan hasil cek ongkir & kurir yang dipilih, per sellerId
  const [rates, setRates] = useState<Record<string, CourierRate[]>>({});
  const [checkingRates, setCheckingRates] = useState<string | null>(null); // sellerId yang sedang loading
  const [selectedCourier, setSelectedCourier] = useState<
    Record<string, CourierRate>
  >({});

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const [summaryRes, addressRes] = await Promise.all([
        fetch("/api/checkout/summary"),
        fetch("/api/addresses"),
      ]);

      if (summaryRes.ok) setGroups(await summaryRes.json());
      if (addressRes.ok) {
        const data: Address[] = await addressRes.json();
        setAddresses(data);
        const defaultAddress = data.find((a) => a.isDefault) ?? data[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  async function handleCheckRates(group: CartGroup) {
    if (!selectedAddressId) {
      setError("Pilih alamat pengiriman dulu");
      return;
    }
    setError(null);
    setCheckingRates(group.sellerId);

    const res = await fetch("/api/shipping/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId: selectedAddressId,
        sellerId: group.sellerId,
        items: group.items.map((item) => ({
          name: item.variant.product.name,
          value: item.variant.product.price,
          weight: item.variant.product.weight,
          quantity: item.qty,
        })),
      }),
    });

    setCheckingRates(null);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Gagal cek ongkir");
      return;
    }

    const data: CourierRate[] = await res.json();
    setRates((prev) => ({ ...prev, [group.sellerId]: data }));
  }

  function handleSelectCourier(sellerId: string, rate: CourierRate) {
    setSelectedCourier((prev) => ({ ...prev, [sellerId]: rate }));
  }

  const allCourierSelected =
    groups.length > 0 && groups.every((g) => selectedCourier[g.sellerId]);

  const grandTotal =
    groups.reduce((sum, g) => sum + g.itemsTotal, 0) +
    Object.values(selectedCourier).reduce((sum, c) => sum + c.price, 0);

  async function handlePay() {
    if (!selectedAddressId || !allCourierSelected) return;
    setPaying(true);
    setError(null);

    const shipments = groups.map((g) => ({
      sellerId: g.sellerId,
      courierName: selectedCourier[g.sellerId].courier_name,
      courierService: selectedCourier[g.sellerId].courier_service_name,
      shippingCost: selectedCourier[g.sellerId].price,
    }));

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: selectedAddressId, shipments }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Checkout gagal");
      setPaying(false);
      return;
    }

    const { paymentSessions } = await res.json();

    // Tampilkan popup Midtrans SATU PER SATU (kalau lebih dari 1 toko).
    // Setelah satu selesai/ditutup, baru lanjut ke sesi berikutnya.
    async function processNext(index: number) {
      if (index >= paymentSessions.length) {
        router.push("/orders");
        return;
      }

      const session = paymentSessions[index];
      window.snap.pay(session.snapToken, {
        onSuccess: () => processNext(index + 1),
        onPending: () => processNext(index + 1),
        onError: () => processNext(index + 1),
        onClose: () => processNext(index + 1),
      });
    }

    processNext(0);
  }

  if (loading)
    return (
      <div className="py-16 text-center font-mono text-[12px] uppercase tracking-[0.1em]" style={{ color: "var(--gray)" }}>
        Memuat checkout...
      </div>
    );

  if (groups.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-[13px]" style={{ color: "var(--gray)" }}>
          Keranjang kamu kosong.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--gray)" }}>
          Manifest Pengiriman
        </p>
        <h1 className="font-display mb-6 mt-1 text-2xl font-black tracking-tight">Checkout</h1>

        {/* ---- Pilih alamat ---- */}
        <div className="mb-5 rounded-md p-4" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--gray)" }}>
            01 — Alamat Pengiriman
          </p>
          {addresses.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--gray)" }}>
              Kamu belum punya alamat.{" "}
              <a href="/profile" style={{ color: "var(--stamp-blue)" }} className="underline">
                Tambah alamat dulu
              </a>
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((address) => {
                const active = selectedAddressId === address.id;
                return (
                  <label
                    key={address.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-3 text-[13px] transition-colors"
                    style={{
                      border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
                      background: active ? "var(--muted)" : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      checked={active}
                      onChange={() => {
                        setSelectedAddressId(address.id);
                        setRates({});
                        setSelectedCourier({});
                      }}
                    />
                    <span>
                      <strong>{address.label}</strong> — {address.recipient},{" "}
                      {address.fullAddress}, {address.city} {address.postalCode}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- Per toko: item + ongkir ---- */}
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--gray)" }}>
          02 — Barang &amp; Ongkir
        </p>
        {groups.map((group) => (
          <div
            key={group.sellerId}
            className="mb-4 rounded-md p-4"
            style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
          >
            <p className="product-store mb-2">{group.storeName}</p>

            <div className="space-y-2">
              {group.items.map((item) => (
                <div key={item.id} className="flex justify-between text-[13px]">
                  <span>
                    {item.variant.product.name}
                    {item.variant.size && ` (${item.variant.size})`} x{item.qty}
                  </span>
                  <span className="font-mono">
                    Rp{(item.variant.product.price * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <hr className="divider-dash" />

            <div className="flex justify-between text-[13px] font-semibold">
              <span>Subtotal</span>
              <span className="font-mono">Rp{group.itemsTotal.toLocaleString("id-ID")}</span>
            </div>

            {/* Ongkir */}
            <div className="mt-4">
              {!rates[group.sellerId] ? (
                <button
                  onClick={() => handleCheckRates(group)}
                  disabled={checkingRates === group.sellerId}
                  className="tag tag-ghost text-[11px]"
                >
                  {checkingRates === group.sellerId ? "Mengecek ongkir..." : "Cek Ongkir"}
                </button>
              ) : (
                <div className="space-y-1.5">
                  {rates[group.sellerId].map((rate, i) => {
                    const active =
                      selectedCourier[group.sellerId]?.courier_service_name ===
                      rate.courier_service_name;
                    return (
                      <label
                        key={i}
                        className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-[12.5px] transition-colors"
                        style={{
                          border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
                          background: active ? "var(--muted)" : "transparent",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`courier-${group.sellerId}`}
                            checked={active}
                            onChange={() => handleSelectCourier(group.sellerId, rate)}
                          />
                          {rate.courier_name.toUpperCase()} - {rate.courier_service_name}{" "}
                          <span style={{ color: "var(--gray)" }}>({rate.duration})</span>
                        </span>
                        <span className="font-mono font-semibold">
                          Rp{rate.price.toLocaleString("id-ID")}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {error && (
          <p className="mb-4 font-mono text-[11px]" style={{ color: "var(--stamp-red)" }}>
            {error}
          </p>
        )}

        <div
          className="sticky bottom-4 mt-6 flex items-center justify-between rounded-md px-5 py-4"
          style={{ background: "var(--ink)", color: "var(--paper)", boxShadow: "var(--shadow-lg)" }}
        >
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/50">Total Bayar</p>
            <p className="font-display text-lg font-extrabold">
              Rp{grandTotal.toLocaleString("id-ID")}
            </p>
          </div>
          <button
            onClick={handlePay}
            disabled={!allCourierSelected || paying}
            className="btn"
            style={{ background: "var(--stamp-red)", color: "#fff" }}
          >
            {paying ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </div>
      </div>
    </>
  );
}
