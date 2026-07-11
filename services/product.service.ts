// services/product.service.ts
//
// Kenapa logika ini tidak langsung ditulis di dalam API route?
// Supaya bisa dipakai ulang di tempat lain (misalnya nanti di Server Action,
// atau di script admin) tanpa harus copy-paste. API route jadi tipis:
// tugasnya cuma "terima request → panggil service → kirim response".

import { prisma } from "@/lib/prisma";
import type { ProductInput } from "@/lib/validations/product";

// Ubah "Kemeja Flanel Pria" jadi "kemeja-flanel-pria-a1b2c3"
// Suffix acak mencegah tabrakan slug kalau ada 2 produk dengan nama sama persis.
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export async function createProduct(sellerId: string, input: ProductInput) {
  return prisma.product.create({
    data: {
      sellerId,
      categoryId: input.categoryId,
      name: input.name,
      slug: generateSlug(input.name),
      description: input.description,
      price: input.price,
      images: {
        create: input.images.map((url, index) => ({
          url,
          isPrimary: index === 0, // gambar pertama otomatis jadi gambar utama
        })),
      },
      variants: {
        create: input.variants,
      },
    },
    include: { images: true, variants: true },
  });
}

export async function updateProduct(
  productId: string,
  sellerId: string,
  input: ProductInput
) {
  // Pastikan produk ini benar-benar milik seller yang sedang request.
  // Tanpa cek ini, seller A bisa saja mengedit produk milik seller B
  // hanya dengan menebak productId di URL — celah keamanan serius.
  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId },
  });

  if (!existing) {
    throw new Error("Produk tidak ditemukan atau bukan milik kamu");
  }

  // Strategi sederhana: hapus semua image & variant lama, buat ulang.
  // Untuk skala besar biasanya di-diff, tapi ini cukup untuk tahap ini.
  await prisma.productImage.deleteMany({ where: { productId } });
  await prisma.productVariant.deleteMany({ where: { productId } });

  return prisma.product.update({
    where: { id: productId },
    data: {
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
      images: {
        create: input.images.map((url, index) => ({
          url,
          isPrimary: index === 0,
        })),
      },
      variants: {
        create: input.variants,
      },
    },
    include: { images: true, variants: true },
  });
}

export async function deleteProduct(productId: string, sellerId: string) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, sellerId },
  });

  if (!existing) {
    throw new Error("Produk tidak ditemukan atau bukan milik kamu");
  }

  return prisma.product.delete({ where: { id: productId } });
}

export async function getSellerProducts(sellerId: string) {
  return prisma.product.findMany({
    where: { sellerId },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: true,
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ==================== SISI BUYER (katalog publik) ====================

type CatalogFilters = {
  search?: string;
  categorySlug?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
};

const PAGE_SIZE = 12;

export async function getPublicProducts(filters: CatalogFilters) {
  const { search, categorySlug, sort = "newest", page = 1 } = filters;

  // Bangun kondisi WHERE secara dinamis — cuma tambahkan filter yang
  // benar-benar diisi user, biar query tetap fleksibel.
  const where = {
    isActive: true,
    ...(search && {
      name: { contains: search, mode: "insensitive" as const },
    }),
    ...(categorySlug && {
      category: { slug: categorySlug },
    }),
  };

  const orderBy =
    sort === "price_asc"
      ? { price: "asc" as const }
      : sort === "price_desc"
      ? { price: "desc" as const }
      : { createdAt: "desc" as const };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        seller: { select: { storeName: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    currentPage: page,
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: true,
      variants: true,
      category: true,
      seller: { select: { storeName: true, storeLogo: true } },
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

// "Rekomendasi" versi sederhana: produk lain di kategori yang sama.
// Nanti di Tahap 8 kita perkaya dengan riwayat lihat/beli user.
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string
) {
  return prisma.product.findMany({
    where: {
      categoryId,
      isActive: true,
      id: { not: excludeProductId },
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    take: 4,
  });
}

// Produk lain dari toko yang sama — dipakai di section "Produk lain dari
// toko ini" pada halaman detail produk, dan di halaman profil toko.
export async function getStoreProducts(
  sellerId: string,
  excludeProductId?: string
) {
  return prisma.product.findMany({
    where: {
      sellerId,
      isActive: true,
      ...(excludeProductId && { id: { not: excludeProductId } }),
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export async function getSellerProfile(sellerId: string) {
  return prisma.seller.findUnique({
    where: { id: sellerId },
    select: {
      id: true,
      storeName: true,
      storeLogo: true,
      description: true,
      createdAt: true,
      _count: { select: { products: true } },
    },
  });
}