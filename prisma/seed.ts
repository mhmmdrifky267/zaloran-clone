// prisma/seed.ts

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = [
    { name: "Pakaian Pria", slug: "pakaian-pria" },
    { name: "Pakaian Wanita", slug: "pakaian-wanita" },
    { name: "Pakaian Anak", slug: "pakaian-anak" },
    { name: "Sepatu Pria", slug: "sepatu-pria" },
    { name: "Sepatu Wanita", slug: "sepatu-wanita" },
    { name: "Tas", slug: "tas" },
    { name: "Aksesoris", slug: "aksesoris" },
    { name: "Jam Tangan", slug: "jam-tangan" },
    { name: "Perhiasan", slug: "perhiasan" },
    { name: "Pakaian Olahraga", slug: "pakaian-olahraga" },
    { name: "Kecantikan & Perawatan", slug: "kecantikan-perawatan" },
    { name: "Perlengkapan Bayi", slug: "perlengkapan-bayi" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log("Seed kategori selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });