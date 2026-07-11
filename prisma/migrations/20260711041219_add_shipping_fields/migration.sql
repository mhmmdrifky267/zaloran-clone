-- AlterTable
ALTER TABLE "products" ADD COLUMN     "weight" INTEGER NOT NULL DEFAULT 500;

-- AlterTable
ALTER TABLE "sellers" ADD COLUMN     "storeAddress" TEXT,
ADD COLUMN     "storeCity" TEXT,
ADD COLUMN     "storePostalCode" TEXT;
