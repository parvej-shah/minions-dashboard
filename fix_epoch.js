const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const epoch = new Date('1970-01-01T00:00:00Z');
  
  const updated = await prisma.asset.updateMany({
    where: {
      publishedAt: epoch
    },
    data: {
      publishedAt: null
    }
  });
  
  console.log(`Updated ${updated.count} assets`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
