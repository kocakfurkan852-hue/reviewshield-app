require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.knowledgeBase.create({
    data: {
      title: "Verletzung der Meinungsfreiheit & Schmähkritik",
      category: "CASE_LAW",
      content: "Eine Bewertung darf gelöscht werden, wenn sie die Grenze zur Schmähkritik überschreitet. Schmähkritik liegt vor, wenn nicht mehr die Auseinandersetzung in der Sache, sondern die Diffamierung der Person im Vordergrund steht (BGH, Urteil vom 29.01.2002 - VI ZR 20/01).",
      source: "BGH, Urteil vom 29.01.2002 - VI ZR 20/01",
      tags: ["Schmähkritik", "BGH", "Meinungsfreiheit"],
      priority: 1,
      active: true
    }
  });

  await prisma.knowledgeBase.create({
    data: {
      title: "Google Deletion Policy: Spam & Fake Engagement",
      category: "GOOGLE_TOS",
      content: "Google's policy explicitly forbids fake engagement. If a reviewer has never been a client, the business can challenge the review. Google requires the reviewer to prove the business relationship.",
      source: "Google Prohibited & Restricted Content Policy",
      tags: ["Fake Engagement", "Spam", "Google TOS"],
      priority: 2,
      active: true
    }
  });

  console.log("Knowledge base seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
