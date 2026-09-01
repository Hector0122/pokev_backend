// Seed inicial: los dos entrenadores fijos (§18) y el catálogo de logros
// (§15). No siembra cartas ni Pokémon — esos se agregan desde la app.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { ACHIEVEMENTS } from '../src/achievements/achievements.catalog';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.trainer.upsert({
    where: { role: 'DAD' },
    create: { role: 'DAD', name: 'Papá' },
    update: {},
  });
  await prisma.trainer.upsert({
    where: { role: 'KID' },
    create: { role: 'KID', name: 'Mi hijo' },
    update: {},
  });

  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: achievement,
      update: {
        category: achievement.category,
        title: achievement.title,
        icon: achievement.icon,
        threshold: achievement.threshold,
      },
    });
  }

  console.log(
    `Seed listo: 2 entrenadores, ${ACHIEVEMENTS.length} logros en el catálogo.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
