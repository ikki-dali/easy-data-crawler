import { PrismaClient, SubscriptionType, Platform, CrawlerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // テストユーザー作成
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'テストユーザー',
      password: hashedPassword,
      subscriptionType: SubscriptionType.PRO,
    },
  });

  console.log('✅ Created user:', user.email);

  // サンプルクローラー作成
  const crawler1 = await prisma.crawler.upsert({
    where: { id: 'sample-crawler-meta' },
    update: {},
    create: {
      id: 'sample-crawler-meta',
      userId: user.id,
      name: 'Meta広告レポート',
      platform: Platform.META_ADS,
      status: CrawlerStatus.ACTIVE,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sample-spreadsheet-id',
      spreadsheetId: 'sample-spreadsheet-id',
      sheetName: 'Meta_Raw',
      accountIds: ['123456789012345'],
      reportConfig: {
        dateRangeType: 'last_x_days_include',
        lookbackDays: 7,
        dimensions: ['date', 'campaign_name', 'ad_set_name'],
        metrics: ['impressions', 'clicks', 'spend', 'cpm', 'ctr', 'reach'],
        customConversions: [],
        customEvents: [],
        excludeZeroCost: true,
      },
      scheduleConfig: {
        frequency: 'daily',
        executionTime: '07:00',
        timezone: 'Asia/Tokyo',
      },
      tags: ['サンプル', 'Meta'],
    },
  });

  console.log('✅ Created crawler:', crawler1.name);

  const crawler2 = await prisma.crawler.upsert({
    where: { id: 'sample-crawler-google' },
    update: {},
    create: {
      id: 'sample-crawler-google',
      userId: user.id,
      name: 'Google広告レポート',
      platform: Platform.GOOGLE_ADS,
      status: CrawlerStatus.INACTIVE,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/sample-spreadsheet-id-2',
      spreadsheetId: 'sample-spreadsheet-id-2',
      sheetName: 'Google_Raw',
      accountIds: ['987-654-3210'],
      reportConfig: {
        dateRangeType: 'from_specific_to_yesterday',
        dateRangeStart: '2024-01-01',
        dimensions: ['date', 'campaign_name'],
        metrics: ['impressions', 'clicks', 'cost', 'conversions'],
        excludeZeroCost: false,
      },
      scheduleConfig: {
        frequency: 'daily',
        executionTime: '08:00',
        timezone: 'Asia/Tokyo',
      },
      tags: ['サンプル', 'Google'],
    },
  });

  console.log('✅ Created crawler:', crawler2.name);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

