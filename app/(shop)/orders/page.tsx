// app/(shop)/orders/page.tsx

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserOrders } from "@/services/order.service";

const statusLabel: Record<string, string> = {
  PENDING: "Menunggu Pembayaran",
  PAID: "Sudah Dibayar",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusTagClass: Record<string, string> = {
  PENDING: "tag-ghost",
  PAID: "tag-blue",
  PROCESSING: "tag-blue",
  SHIPPED: "tag-moss",
  COMPLETED: "tag-moss",
  CANCELLED: "tag-gray",
};

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="font-display mb-6 text-2xl font-black tracking-tight">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <div
          className="rounded-md px-6 py-12 text-center"
          style={{ border: "1px dashed var(--line-strong)" }}
        >
          <p className="text-[13px]" style={{ color: "var(--gray)" }}>
            Belum ada pesanan.
          </p>
          <Link href="/products" className="tag mt-4 inline-flex">
            Mulai Belanja →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-md p-4 transition-shadow"
              style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--gray)" }}>
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="mt-0.5 font-semibold">{order.seller.storeName}</p>
                </div>
                <span className={`tag ${statusTagClass[order.status] ?? "tag-gray"} shrink-0`}>
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>

              <hr className="divider-dash" style={{ margin: "10px 0" }} />

              <div className="flex items-center justify-between">
                <p className="text-[12.5px]" style={{ color: "var(--gray)" }}>
                  {order.items.length} produk ·{" "}
                  {new Date(order.createdAt).toLocaleDateString("id-ID", { dateStyle: "long" })}
                </p>
                <p className="product-price">Rp{order.totalPrice.toLocaleString("id-ID")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
