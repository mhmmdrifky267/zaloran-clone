// components/review/ReviewForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError("Pilih rating bintang dulu");
      return;
    }
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, comment: comment || undefined }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Gagal mengirim ulasan");
      return;
    }

    setSubmitted(true);
    router.refresh(); // supaya halaman detail produk yang mungkin dibuka lain tab ikut update
  }

  if (submitted) {
    return (
      <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
        Terima kasih! Ulasan kamu sudah terkirim.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-md border p-3">
      <p className="mb-2 text-sm font-medium">Beri Ulasan</p>

      <div className="mb-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-2xl leading-none"
          >
            {star <= (hoverRating || rating) ? "★" : "☆"}
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        placeholder="Bagaimana pengalaman kamu dengan produk ini? (opsional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-md bg-black px-4 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {submitting ? "Mengirim..." : "Kirim Ulasan"}
      </button>
    </form>
  );
}