// services/order.service.ts

import { prisma } from "@/lib/prisma";
import { getCartGroupedBySeller } from "./cart.service";
import { getEffectivePrice } from "@/lib/pricing";

type ShipmentSelection = {
  sellerId: string;
  courierName: string;
  courierService: string;
  shippingCost: number;
};

// Dipanggil saat user klik "Bayar Sekarang". Untuk setiap toko di cart yang
// sudah dipilih kurirnya, buat satu Order + OrderItems, kurangi stok, dan
// hapus item itu dari cart. Dibungkus $transaction supaya atomik — kalau
// satu langkah gagal (misal stok berubah di tengah jalan), semua dibatalkan.
export async function createOrdersFromCart(
  userId: string,
  addressId: string,
  shipments: ShipmentSelection[]
) {
  const groups = await getCartGroupedBySeller(userId);

  const orders = await prisma.$transaction(async (tx) => {
    const createdOrders = [];

    for (const shipment of shipments) {
      const group = groups.find((g) => g.sellerId === shipment.sellerId);
      if (!group || group.items.length === 0) continue;

      // Validasi ulang stok di dalam transaksi — mencegah race condition
      // kalau ada pembeli lain checkout produk yang sama di waktu bersamaan.
      for (const item of group.items) {
        if (item.qty > item.variant.stock) {
          throw new Error(
            `Stok "${item.variant.product.name}" tidak lagi mencukupi`
          );
        }
      }

      const totalPrice = group.itemsTotal + shipment.shippingCost;

      const order = await tx.order.create({
        data: {
          userId,
          sellerId: shipment.sellerId,
          addressId,
          itemsTotal: group.itemsTotal,
          shippingCost: shipment.shippingCost,
          totalPrice,
          courierName: shipment.courierName,
          courierService: shipment.courierService,
          items: {
            create: group.items.map((item) => ({
              productVariantId: item.productVariantId,
              qty: item.qty,
              priceAtOrder: getEffectivePrice(
                item.variant.product.price,
                item.variant.product.discountPercent
              ),
            })),
          },
        },
        include: { items: true },
      });

      // Kurangi stok tiap varian yang dibeli
      for (const item of group.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { decrement: item.qty } },
        });
      }

      // Hapus item-item toko ini dari cart (checkout selesai untuk toko ini)
      await tx.cartItem.deleteMany({
        where: { id: { in: group.items.map((i) => i.id) } },
      });

      createdOrders.push(order);
    }

    return createdOrders;
  });

  return orders;
}

// Dipanggil dari webhook Midtrans saat transaksi berakhir gagal/batal/expired.
// Mengembalikan stok yang sempat dikurangi saat checkout, supaya pesanan yang
// tidak pernah dibayar tidak "mengunci" stok selamanya. Idempotent: kalau
// order sudah CANCELLED sebelumnya, tidak akan mengembalikan stok dua kali.
export async function cancelOrderAndRestoreStock(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status === "CANCELLED") return; // sudah dibatalkan, jangan restore dobel

    for (const item of order.items) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: { stock: { increment: item.qty } },
      });
    }

    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
  });
}

// Dipanggil sebelum membuat ulang Snap token (tombol "Bayar Lagi") untuk
// pesanan yang statusnya masih PENDING. Memvalidasi kepemilikan order supaya
// user tidak bisa membayar ulang pesanan orang lain.
export async function getPendingOrderForRetry(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "PENDING" },
    include: { payment: true },
  });
  if (!order) throw new Error("Pesanan tidak ditemukan atau sudah tidak bisa dibayar ulang");
  return order;
}

export async function getOrderById(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: { include: { variant: { include: { product: true } } } },
      address: true,
      seller: { select: { storeName: true } },
      payment: true,
    },
  });
}

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            },
          },
        },
      },
      seller: { select: { storeName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ==================== SISI SELLER ====================

export async function getSellerOrders(sellerId: string) {
  return prisma.order.findMany({
    where: { sellerId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
            },
          },
        },
      },
      address: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// Transisi status yang diizinkan — seller cuma bisa maju satu langkah,
// tidak bisa "loncat" status atau mundur. CANCELLED bisa terjadi dari
// mana saja SEBELUM SHIPPED (misal stok ternyata bermasalah).
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
};

export async function updateOrderStatus(
  orderId: string,
  sellerId: string,
  newStatus: string
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, sellerId },
  });
  if (!order) throw new Error("Pesanan tidak ditemukan");

  const allowedNext = ALLOWED_TRANSITIONS[order.status] ?? [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Tidak bisa ubah status dari ${order.status} ke ${newStatus}`
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus as never },
  });
}

export async function getSellerStats(sellerId: string) {
  const [orderStats, bestSellingVariant] = await Promise.all([
    // Total pendapatan & jumlah pesanan — cuma hitung yang statusnya
    // sudah PAID ke atas (bukan yang masih PENDING/CANCELLED)
    prisma.order.aggregate({
      where: {
        sellerId,
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
      },
      _sum: { totalPrice: true },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ["productVariantId"],
      where: {
        order: {
          sellerId,
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "COMPLETED"] },
        },
      },
      _sum: { qty: true },
      orderBy: { _sum: { qty: "desc" } },
      take: 1,
    }),
  ]);

  let bestSellingProductName: string | null = null;
  if (bestSellingVariant.length > 0) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: bestSellingVariant[0].productVariantId },
      include: { product: { select: { name: true } } },
    });
    bestSellingProductName = variant?.product.name ?? null;
  }

  return {
    totalRevenue: orderStats._sum.totalPrice ?? 0,
    totalOrders: orderStats._count,
    bestSellingProductName,
    bestSellingQty: bestSellingVariant[0]?._sum.qty ?? 0,
  };
}