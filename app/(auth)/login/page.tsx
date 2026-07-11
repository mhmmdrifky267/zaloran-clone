// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // signIn("credentials", ...) memanggil fungsi authorize() yang kita
    // tulis di auth.ts. redirect:false artinya kita yang atur redirect manual,
    // supaya bisa menampilkan pesan error di halaman yang sama.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email atau password salah");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="mb-6 text-2xl font-bold">Masuk</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black py-2 text-white disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <a href="/forgot-password" className="text-gray-500 hover:underline">
            Lupa sandi?
          </a>
          <a href="/register" className="text-blue-600 hover:underline">
            Belum punya akun? Daftar
          </a>
        </div>
      </form>
    </div>
  );
}