// app/(shop)/orders/[id]/page.tsx

import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getOrderById } from "@/services/order.service";
import { canUserReviewProduct, hasUserReviewedProduct } from "@/services/review.service";
import { ReviewForm } from "@/components/review/ReviewForm";

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Sudah Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Detail Pesanan</h1>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      <div className="mb-4 rounded-md border p-4">
        <p className="text-sm text-gray-500">Toko</p>
        <p className="font-medium">{order.seller.storeName}</p>
      </div>

      <div className="mb-4 rounded-md border p-4">
        <p className="mb-2 text-sm font-medium">Alamat Pengiriman</p>
        <p className="text-sm text-gray-600">
          {order.address.recipient} — {order.address.fullAddress},{" "}
          {order.address.city} {order.address.postalCode}
        </p>
        {order.courierName && (
          <p className="mt-1 text-sm text-gray-500">
            Kurir: {order.courierName.toUpperCase()} - {order.courierService}
          </p>
        )}
      </div>

      <div className="mb-4 rounded-md border p-4">
        <p className="mb-2 text-sm font-medium">Produk</p>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.variant.product.name} x{item.qty}
              </span>
              <span>
                Rp{(item.priceAtOrder * item.qty).toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rp{order.itemsTotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Ongkir</span>
            <span>Rp{order.shippingCost.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>Rp{order.totalPrice.toLocaleString("id-ID")}</span>
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
                  className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-500"
                >
                  ✓ Kamu sudah mengulas {item.variant.product.name}
                </p>
              );
            }

            if (status === "can_review") {
              return (
                <div key={item.id}>
                  <p className="mb-1 text-sm text-gray-500">
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