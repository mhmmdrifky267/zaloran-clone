// app/api/categories/route.ts
//
// Endpoint publik (tidak perlu login) — dipakai di form produk seller
// (dropdown pilih kategori) dan filter katalog buyer.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}