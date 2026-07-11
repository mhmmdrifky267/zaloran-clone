// app/api/cart/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCartWithDetails, addToCart } from "@/services/cart.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const cart = await getCartWithDetails(session.user.id);
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const { productVariantId, qty } = await request.json();

  if (!productVariantId || !qty || qty < 1) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  try {
    await addToCart(session.user.id, productVariantId, qty);
    const cart = await getCartWithDetails(session.user.id);
    return NextResponse.json(cart, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}