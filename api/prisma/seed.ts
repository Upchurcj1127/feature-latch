import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';

const prisma = new PrismaClient();
const sdkKey = process.env.SDK_KEY ?? 'test-sdk-key';

const policy = JSON.parse(
  readFileSync(new URL('../docs/policy.example.json', import.meta.url), 'utf8')
);

async function main() {
  await prisma.app.upsert({
    where: { name: 'Lumen Ascent' },
    update: {
      sdkKey,
      policyJson: policy,
    },
    create: {
      name: 'Lumen Ascent',
      sdkKey,
      policyJson: policy,
    },
  });

  console.log('Seeded app: Lumen Ascent');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
