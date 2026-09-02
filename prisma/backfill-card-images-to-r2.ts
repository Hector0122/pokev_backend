import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? 'pokev';

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function getClient(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey || !R2_PUBLIC_URL) {
    throw new Error(
      'Faltan las variables de R2 en el entorno — ver .env.example.',
    );
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

async function main() {
  const client = getClient();

  const httpCards = await prisma.card.findMany({
    where: { imageUrl: { startsWith: 'http' } }, // salta null y data:image/... (ya locales)
    select: { id: true, imageUrl: true, pokemon: { select: { name: true } } },
  });

  const toMigrate = httpCards.filter(
    (c) => !c.imageUrl!.startsWith(R2_PUBLIC_URL),
  );

  console.log(
    `${toMigrate.length} carta(s) con foto externa por migrar (de ${httpCards.length} con URL http en total, el resto ya está en R2).`,
  );

  let migrated = 0;
  let failed = 0;

  for (const card of toMigrate) {
    try {
      const response = await fetch(card.imageUrl!);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') ?? 'image/jpeg';
      const ext = EXT_BY_CONTENT_TYPE[contentType] ?? 'jpg';
      const buffer = Buffer.from(await response.arrayBuffer());

      const key = `cards/${randomUUID()}.${ext}`;
      await client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      );

      const newUrl = `${R2_PUBLIC_URL}/${key}`;
      await prisma.card.update({
        where: { id: card.id },
        data: { imageUrl: newUrl },
      });

      migrated++;
      console.log(
        `✓ ${card.pokemon.name} (${card.id}): ${card.imageUrl} → ${newUrl}`,
      );
    } catch (error) {
      failed++;
      console.error(
        `✗ ${card.pokemon.name} (${card.id}): ${(error as Error).message} — se dejó la URL externa como estaba.`,
      );
    }
  }

  console.log(`\nListo: ${migrated} migradas, ${failed} con error.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
