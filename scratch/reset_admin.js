const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// We need to use the adapter because that's how the app is configured
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const newHash = bcrypt.hashSync('password123', 10);
  await prisma.user.update({
    where: { email: 'admin@sternrecht.de' },
    data: { password_hash: newHash }
  });
  console.log('Admin password reset to password123 successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
