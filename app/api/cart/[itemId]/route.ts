// app/api/cart/[itemId]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateCartItemQty, removeCartItem } from "@/services/cart.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const { itemId } = await params;
  const { qty } = await request.json();

  try {
    await updateCartItemQty(session.user.id, itemId, qty);
    return NextResponse.json({ message: "Cart diperbarui" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const { itemId } = await params;

  try {
    await removeCartItem(session.user.id, itemId);
    return NextResponse.json({ message: "Item dihapus" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}