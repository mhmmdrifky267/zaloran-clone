// app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validasi input — kalau gagal, kembalikan pesan error yang jelas
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role, storeName, storeCity, storePostalCode } = parsed.data;

    // 2. Cek email sudah dipakai atau belum
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    // 3. Hash password — JANGAN PERNAH simpan password asli ke database
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Buat user. Kalau daftar sebagai SELLER, sekaligus buat data Seller
    //    dan Cart kosong, dibungkus dalam satu transaksi Prisma supaya
    //    kalau salah satu gagal, semuanya dibatalkan (tidak ada data setengah jadi).
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      // Setiap user (buyer atau seller) tetap butuh cart pribadi
      await tx.cart.create({
        data: { userId: newUser.id },
      });

      if (role === "SELLER" && storeName) {
        await tx.seller.create({
          data: {
            userId: newUser.id,
            storeName,
            storeCity,
            storePostalCode,
            isApproved: false, // butuh approval admin sebelum bisa jualan
          },
        });
      }

      return newUser;
    });

    return NextResponse.json(
      { message: "Registrasi berhasil", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}