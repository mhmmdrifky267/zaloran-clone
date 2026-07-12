// services/review.service.ts

import { prisma } from "@/lib/prisma";

export async function hasUserReviewedProduct(userId: string, productId: string) {
  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return !!existing;
}

// Dipakai untuk menentukan apakah tombol "Beri Ulasan" boleh muncul —
// cek apakah user punya order COMPLETED yang berisi produk ini.
export async function canUserReviewProduct(userId: string, productId: string) {
  const alreadyReviewed = await hasUserReviewedProduct(userId, productId);
  if (alreadyReviewed) return false;

  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      order: { userId, status: "COMPLETED" },
      variant: { productId },
    },
  });

  return !!hasPurchased;
}

export async function createReview(
  userId: string,
  productId: string,
  rating: number,
  comment?: string
) {
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      order: { userId, status: "COMPLETED" },
      variant: { productId },
    },
  });

  if (!hasPurchased) {
    throw new Error(
      "Kamu hanya bisa mengulas produk yang sudah kamu beli dan pesanannya selesai"
    );
  }

  // Kalau user coba review produk yang sama 2x, constraint unik di database
  // (@@unique([userId, productId])) akan menolaknya otomatis — kita tangkap
  // errornya di API route supaya pesannya ramah, bukan error database mentah.
  return prisma.review.create({
    data: { userId, productId, rating, comment },
  });
}