const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Militar" ADD COLUMN IF NOT EXISTS pcnh BOOLEAN NOT NULL DEFAULT false;');
    console.log('Migration applied successfully via Prisma!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
