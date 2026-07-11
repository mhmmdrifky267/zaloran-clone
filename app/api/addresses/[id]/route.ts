// app/api/addresses/[id]/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addressSchema } from "@/lib/validations/address";
import { updateAddress, deleteAddress } from "@/services/address.service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = addressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const address = await updateAddress(id, session.user.id, parsed.data);
    return NextResponse.json(address);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 404 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteAddress(id, session.user.id);
    return NextResponse.json({ message: "Alamat dihapus" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 404 }
    );
  }
}