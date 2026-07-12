// app/api/reviews/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reviewSchema } from "@/lib/validations/review";
import { createReview } from "@/services/review.service";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const review = await createReview(
      session.user.id,
      parsed.data.productId,
      parsed.data.rating,
      parsed.data.comment
    );
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    // Prisma melempar error kode P2002 kalau constraint unik dilanggar
    // (artinya user sudah pernah review produk ini sebelumnya)
    const isDuplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002";

    return NextResponse.json(
      {
        error: isDuplicate
          ? "Kamu sudah pernah mengulas produk ini"
          : (error as Error).message,
      },
      { status: 400 }
    );
  }
}