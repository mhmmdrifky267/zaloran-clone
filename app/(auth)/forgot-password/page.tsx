// app/(auth)/forgot-password/page.tsx
//
// PLACEHOLDER — fitur reset password via email belum kita bangun
// (butuh integrasi pengiriman email, masuk ke tahap lanjutan nanti).
// Untuk sekarang halaman ini sekadar supaya link "Lupa sandi?" tidak 404.

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <h1 className="mb-2 text-2xl font-bold">Lupa Sandi</h1>
      <p className="text-sm text-gray-500">
        Fitur reset password lewat email masih dalam pengembangan. Untuk
        sekarang, hubungi admin kalau kamu lupa sandi akunmu.
      </p>
      <a href="/login" className="mt-4 inline-block text-blue-600 hover:underline">
        ← Kembali ke halaman login
      </a>
    </div>
  );
}