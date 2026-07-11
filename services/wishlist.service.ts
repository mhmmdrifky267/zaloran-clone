// services/wishlist.service.ts

import { prisma } from "@/lib/prisma";

export async function getWishlist(userId: string) {
  return prisma.wishlist.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          seller: { select: { storeName: true } },
        },
      },
    },
    orderBy: { id: "desc" },
  });
}

// "Toggle" — kalau sudah ada di wishlist, hapus. Kalau belum, tambahkan.
// Ini bikin 1 tombol hati bisa berfungsi untuk 2 aksi sekaligus.
export async function toggleWishlist(userId: string, productId: string) {
  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } });
    return { wishlisted: false };
  }

  await prisma.wishlist.create({ data: { userId, productId } });
  return { wishlisted: true };
}

export async function isProductWishlisted(userId: string, productId: string) {
  const existing = await prisma.wishlist.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return !!existing;
}