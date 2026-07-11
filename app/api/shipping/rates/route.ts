// app/api/shipping/rates/route.ts
//
// Endpoint ini dipanggil dari halaman checkout (Tahap 7 nanti) dengan
// body: { addressId, sellerId, items: [{ name, value, weight, quantity }] }
//
// Kenapa perlu sellerId juga, bukan cuma addressId? Karena cart bisa berisi
// produk dari BEBERAPA toko sekaligus, dan tiap toko punya lokasi asal
// (dan ongkir) yang beda. Ongkir dihitung PER TOKO, bukan sekali untuk
// seluruh cart — ini pola standar marketplace multi-seller.

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShippingRates, type ShippingItem } from "@/lib/biteship";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const { addressId, sellerId, items } = (await request.json()) as {
    addressId: string;
    sellerId: string;
    items: ShippingItem[];
  };

  if (!addressId || !sellerId || !items?.length) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  // Ambil alamat tujuan (pastikan itu benar-benar milik user yang login)
  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: session.user.id },
  });
  if (!address) {
    return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
  }

  // Ambil alamat asal (toko seller)
  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (!seller?.storePostalCode) {
    return NextResponse.json(
      { error: "Toko ini belum melengkapi alamat pengiriman" },
      { status: 400 }
    );
  }

  try {
    const rates = await getShippingRates({
      originPostalCode: seller.storePostalCode,
      destinationPostalCode: address.postalCode,
      items,
    });
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 502 }
    );
  }
}