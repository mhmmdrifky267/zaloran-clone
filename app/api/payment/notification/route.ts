// app/api/payment/notification/route.ts
//
// Ini BUKAN dipanggil dari browser kita — ini dipanggil oleh SERVER Midtrans
// setiap kali status pembayaran berubah (misal: user berhasil transfer).
// Kamu wajib daftarkan URL endpoint ini di dashboard Midtrans:
// SETTINGS → Configuration → Payment Notification URL
// (saat development, pakai URL tunnel seperti ngrok karena localhost
// tidak bisa diakses dari internet oleh server Midtrans).

import { NextResponse } from "next/server";
import { snap } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import { cancelOrderAndRestoreStock } from "@/services/order.service";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    // snap.transaction.notification() otomatis memvalidasi signature key,
    // supaya kita yakin notifikasi ini benar-benar dari Midtrans, bukan
    // orang iseng yang menembak endpoint ini langsung.
    const statusResponse = await snap.transaction.notification(body);

    // order_id yang dikirim ke Midtrans bisa punya suffix "-retry-<timestamp>"
    // (dipasang oleh endpoint /api/payment/retry supaya Midtrans menerima
    // order_id baru yang unik). Order kita sendiri selalu pakai id ASLI
    // (tanpa suffix), jadi harus di-strip dulu sebelum dipakai untuk lookup.
    const rawOrderId = statusResponse.order_id as string;
    const orderId = rawOrderId.split("-retry-")[0];

    const transactionStatus = statusResponse.transaction_status as string;
    const fraudStatus = statusResponse.fraud_status as string | undefined;

    const existingPayment = await prisma.payment.findUnique({ where: { orderId } });
    if (!existingPayment) {
      // Order tidak ditemukan (mustahil kalau order_id valid) — abaikan saja
      // daripada melempar 500 yang bikin Midtrans terus mencoba ulang.
      return NextResponse.json({ received: true });
    }

    // Jaga urutan: kalau pembayaran ini SUDAH final (SUCCESS/FAILED),
    // notifikasi susulan yang datang telat (misal "pending" yang nyasar
    // setelah "settlement") tidak boleh menurunkan status yang sudah final.
    if (existingPayment.status === "SUCCESS" || existingPayment.status === "FAILED") {
      return NextResponse.json({ received: true, ignored: "already-final" });
    }

    let paymentStatus: "PENDING" | "SUCCESS" | "FAILED" = "PENDING";
    let shouldCancelAndRestoreStock = false;

    if (transactionStatus === "capture" || transactionStatus === "settlement") {
      if (fraudStatus === "accept" || !fraudStatus) {
        paymentStatus = "SUCCESS";
      }
    } else if (
      transactionStatus === "cancel" ||
      transactionStatus === "deny" ||
      transactionStatus === "expire"
    ) {
      paymentStatus = "FAILED";
      shouldCancelAndRestoreStock = true;
    }
    // status "pending" (misal masih menunggu transfer VA) dibiarkan PENDING

    await prisma.payment.update({
      where: { orderId },
      data: {
        status: paymentStatus,
        transactionId: statusResponse.transaction_id,
        paidAt: paymentStatus === "SUCCESS" ? new Date() : null,
      },
    });

    if (paymentStatus === "SUCCESS") {
      await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
    } else if (shouldCancelAndRestoreStock) {
      // Kembalikan stok yang sempat dikunci saat checkout — pesanan yang
      // gagal/batal/kedaluwarsa tidak boleh menahan stok selamanya.
      await cancelOrderAndRestoreStock(orderId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Midtrans notification error:", error);
    return NextResponse.json({ error: "Gagal memproses notifikasi" }, { status: 500 });
  }
}