// services/address.service.ts

import { prisma } from "@/lib/prisma";
import type { AddressInput } from "@/lib/validations/address";

export async function getAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function createAddress(userId: string, input: AddressInput) {
  // Kalau ini alamat pertama user, otomatis jadikan default —
  // supaya user tidak perlu ingat "set default" manual di alamat pertamanya.
  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = input.isDefault || existingCount === 0;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      // Lepas status default dari semua alamat lain milik user ini
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: { ...input, userId, isDefault: shouldBeDefault },
    });
  });
}

export async function updateAddress(
  addressId: string,
  userId: string,
  input: AddressInput
) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new Error("Alamat tidak ditemukan");

  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return tx.address.update({
      where: { id: addressId },
      data: input,
    });
  });
}

export async function deleteAddress(addressId: string, userId: string) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw new Error("Alamat tidak ditemukan");

  await prisma.address.delete({ where: { id: addressId } });

  // Kalau yang dihapus adalah alamat default, dan masih ada alamat lain
  // tersisa, otomatis jadikan salah satunya default — supaya user tidak
  // "kehilangan" default address tanpa sadar saat checkout nanti.
  if (existing.isDefault) {
    const remaining = await prisma.address.findFirst({ where: { userId } });
    if (remaining) {
      await prisma.address.update({
        where: { id: remaining.id },
        data: { isDefault: true },
      });
    }
  }
}