// app/api/addresses/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addressSchema } from "@/lib/validations/address";
import { getAddresses, createAddress } from "@/services/address.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const addresses = await getAddresses(session.user.id);
  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const address = await createAddress(session.user.id, parsed.data);
  return NextResponse.json(address, { status: 201 });
}