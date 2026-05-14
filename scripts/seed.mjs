import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@sternrecht.de';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('Admin user already exists:', adminEmail);
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Sternrecht Admin',
      role: 'ADMIN',
      password_hash: hashedPassword
    }
  });

  console.log('Created Admin user:', admin.email);

  // Initialize System Settings if they don't exist
  const defaultSettings = [
    { key: 'polling_interval_minutes', value: '15' },
    { key: 'approval_gate_enabled', value: 'true' },
    { key: 'default_reminder_interval_days', value: '14' },
    { key: 'default_reminder_max_count', value: '3' },
    { key: 'reminder_grace_period_days', value: '3' }
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { setting_key: setting.key },
      update: {},
      create: {
        setting_key: setting.key,
        setting_value: setting.value
      }
    });
  }
  
  console.log('System settings initialized.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
