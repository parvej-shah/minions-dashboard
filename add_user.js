const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'parvejshah005@gmail.com';
  let client = await prisma.client.findFirst();
  if (!client) {
    client = await prisma.client.create({ data: { name: 'Tenant Zero', slug: 'tenant-zero-getminions-ai', status: 'ACTIVE' } });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: 'Parvej Shah',
        role: 'ADMIN',
        clientId: client.id
      }
    });
    console.log('User created:', user);
  } else {
    console.log('User already exists:', user);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
