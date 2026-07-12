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

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">Belum ada pesanan.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-md border p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{order.seller.storeName}</p>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {order.items.length} produk · Rp
                {order.totalPrice.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(order.createdAt).toLocaleDateString("id-ID", {
                  dateStyle: "long",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}