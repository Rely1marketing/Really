import { connect, disconnect } from '../server/src/db';
import { ensureIndexes } from '../server/src/initIndexes';
import {
  Company,
  Customer,
  Campaign,
  CampaignResult,
} from '../server/src/models';

async function run() {
  await connect();
  await ensureIndexes();

  await Promise.all([
    Company.deleteMany({}),
    Customer.deleteMany({}),
    Campaign.deleteMany({}),
    CampaignResult.deleteMany({}),
  ]);

  const company = await Company.create({
    company_id: 'really-hair-ab',
    name: 'Really Hair AB',
    channels: ['sms'],
    locales: ['sv-SE'],
    locations: [
      { address: 'Storgatan 1, Stockholm', hours: ['Mån-Fre 09-18', 'Lör 10-15'] },
    ],
    web_enrichment: {
      services: ['Klippning', 'Färgning', 'Styling'],
      usps: ['Ekologiska produkter', 'Erfarna frisörer'],
      title: 'Välkommen till Really Hair AB',
    },
  });

  await Customer.create([
    {
      customer_id: 'cust-1',
      company_id: company._id,
      name: 'Anna Andersson',
      phone: '+46701111111',
      tags: ['vip'],
      opt_in: { sms: true, sms_ts: new Date('2024-01-10T10:00:00Z'), email: false },
    },
    {
      customer_id: 'cust-2',
      company_id: company._id,
      name: 'Björn Berg',
      phone: '+46702222222',
      tags: ['student'],
      opt_in: { sms: true, sms_ts: new Date('2024-01-15T12:00:00Z'), email: false },
    },
    {
      customer_id: 'cust-3',
      company_id: company._id,
      name: 'Cecilia Carlsson',
      phone: '+46703333333',
      tags: ['loyal'],
      opt_in: { sms: true, sms_ts: new Date('2024-02-20T09:00:00Z'), email: false },
    },
  ]);

  const campaign = await Campaign.create({
    campaign_id: 'spring-sale',
    company_id: company._id,
    brief: 'Vårerbjudande',
    message: '20% rabatt på klippning hela april!',
    snapshot: { customers: 3 },
  });

  await CampaignResult.create({
    campaign_id: campaign._id,
    replies_7d: 12,
    clicks_7d: 30,
    bookings_7d: 9,
  });

  console.log('Seed completed');
  await disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
