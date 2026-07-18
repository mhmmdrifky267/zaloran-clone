// app/(shop)/orders/[id]/page.tsx

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOrderById } from "@/services/order.service";
import { canUserReviewProduct, hasUserReviewedProduct } from "@/services/review.service";
import { ReviewForm } from "@/components/review/ReviewForm";
import { PayAgainButton } from "@/components/product/PayAgainButton";

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Sudah Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

// Warna tag per status — mengikuti palet stamp yang sama dengan badge diskon/baru
const statusTagClass: Record<string, string> = {
  PENDING: "tag-ghost",
  PAID: "tag-blue",
  PROCESSING: "tag-blue",
  SHIPPED: "tag-moss",
  COMPLETED: "tag-moss",
  CANCELLED: "tag-gray",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const order = await getOrderById(id, session.user.id);
  if (!order) notFound();

  // Untuk pesanan yang sudah selesai, cek status review tiap produk —
  // dilakukan di Server Component supaya tidak perlu loading state
  // tambahan di client saat halaman pertama kali dibuka.
  const reviewStatus = new Map<string, "can_review" | "reviewed" | "cannot_review">();

  if (order.status === "COMPLETED") {
    for (const item of order.items) {
      const productId = item.variant.product.id;
      if (reviewStatus.has(productId)) continue;

      const alreadyReviewed = await hasUserReviewedProduct(session.user.id, productId);
      if (alreadyReviewed) {
        reviewStatus.set(productId, "reviewed");
      } else {
        const canReview = await canUserReviewProduct(session.user.id, productId);
        reviewStatus.set(productId, canReview ? "can_review" : "cannot_review");
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--gray)" }}>
            Manifest #{order.id.slice(-8).toUpperCase()}
          </p>
          <h1 className="font-display mt-1 text-2xl font-black tracking-tight">Detail Pesanan</h1>
        </div>
        <span className={`tag ${statusTagClass[order.status] ?? "tag-gray"}`}>
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      {/* ---- Bayar lagi — hanya untuk pesanan yang masih menunggu pembayaran ---- */}
      {order.status === "PENDING" && (
        <div
          className="mb-6 rounded-md px-5 py-5"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          <p className="font-display text-[15px] font-extrabold">Menunggu Pembayaran</p>
          <p className="mt-1 mb-4 text-[13px] text-white/60">
            Selesaikan pembayaran sebelum sesi kedaluwarsa, atau buat sesi baru di bawah ini.
          </p>
          <PayAgainButton orderId={order.id} />
        </div>
      )}

      <div className="mb-4 rounded-md p-4" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--gray)" }}>
          Toko
        </p>
        <p className="mt-1 font-semibold">{order.seller.storeName}</p>
      </div>

      <div className="mb-4 rounded-md p-4" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--gray)" }}>
          Alamat Pengiriman
        </p>
        <p className="text-[13px] leading-relaxed">
          {order.address.recipient} — {order.address.fullAddress},{" "}
          {order.address.city} {order.address.postalCode}
        </p>
        {order.courierName && (
          <p className="mt-1 font-mono text-[11px]" style={{ color: "var(--gray)" }}>
            Kurir: {order.courierName.toUpperCase()} - {order.courierService}
          </p>
        )}
      </div>

      <div className="mb-6 rounded-md p-4" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--gray)" }}>
          Produk
        </p>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-[13px]">
              <span>
                {item.variant.product.name} x{item.qty}
              </span>
              <span className="font-mono font-semibold">
                Rp{(item.priceAtOrder * item.qty).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        <hr className="divider-dash" />

        <div className="space-y-1.5 text-[13px]">
          <div className="flex justify-between" style={{ color: "var(--gray)" }}>
            <span>Subtotal</span>
            <span className="font-mono">Rp{order.itemsTotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between" style={{ color: "var(--gray)" }}>
            <span>Ongkir</span>
            <span className="font-mono">Rp{order.shippingCost.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-[15px] font-bold">
            <span>Total</span>
            <span className="font-mono">Rp{order.totalPrice.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>

      {/* ---- Review, hanya untuk pesanan yang sudah selesai ---- */}
      {order.status === "COMPLETED" && (
        <div className="space-y-3">
          {order.items.map((item) => {
            const productId = item.variant.product.id;
            const status = reviewStatus.get(productId);

            if (status === "reviewed") {
              return (
                <p
                  key={item.id}
                  className="rounded-md px-3 py-2.5 font-mono text-[11px]"
                  style={{ background: "var(--muted)", color: "var(--gray)" }}
                >
                  ✓ Kamu sudah mengulas {item.variant.product.name}
                </p>
              );
            }

            if (status === "can_review") {
              return (
                <div key={item.id}>
                  <p className="mb-1 text-[13px]" style={{ color: "var(--gray)" }}>
                    {item.variant.product.name}
                  </p>
                  <ReviewForm productId={productId} />
                </div>
              );
            }

            return null; // status "cannot_review" — tidak tampilkan apa-apa
          })}
        </div>
      )}
    </div>
  );
}
