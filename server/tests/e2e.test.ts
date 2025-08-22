import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/server';
import { CampaignEvent, Campaign, CampaignResult } from '../src/models';

async function main() {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);

  const agent = request(app);

  await agent
    .post('/save_company_profile')
    .send({ company_id: 'c1', name: 'Acme', locales: ['Europe/Stockholm'] })
    .expect(200);

  const policy = await agent
    .get('/get_policy_status')
    .query({
      company_id: 'c1',
      channel: 'sms',
      datetime: '2025-01-01T20:00:00.000Z',
    })
    .expect(200);
  console.log('policy allowed', policy.body.allowed);

  for (let i = 0; i < 3; i++) {
    await agent
      .post('/save_customer')
      .send({
        customer_id: `cust${i}`,
        company_id: 'c1',
        phone: `+1000000000${i}`,
        tags: i === 0 ? ['vip'] : ['regular'],
      })
      .expect(200);
  }

  await agent.get('/find_customers').expect(400);

  const vip = await agent
    .get('/find_customers')
    .query({ company_id: 'c1', tags: 'vip' })
    .expect(200);
  console.log('found VIP customers', vip.body.length);

  await agent
    .post('/start_web_enrichment')
    .send({
      company_id: 'c1',
      sources: [{ kind: 'website', url: 'https://example.com' }],
    })
    .expect(200);

  const list = await agent
    .get('/list_web_diffs')
    .query({ company_id: 'c1' })
    .expect(200);
  const diffId = list.body[0].diff_id;

  await agent
    .post(`/apply_web_diff/${diffId}`)
    .send({ action: 'approve' })
    .expect(200);

  const camp = await agent
    .post('/record_campaign')
    .send({
      company_id: 'c1',
      brief: 'hi',
      message: 'hello',
      channel: 'sms',
      scheduled_at: '2025-01-01T20:00:00.000Z',
    })
    .expect(200);
  console.log('scheduled_at', camp.body.scheduled_at);
  if (camp.body.scheduled_at === '2025-01-01T20:00:00.000Z') {
    throw new Error('campaign was not rescheduled');
  }

  const campaign: any = await Campaign.findOne({ campaign_id: camp.body.campaign_id }).lean();

  await agent
    .post('/record_campaign_event')
    .send({ campaign_id: camp.body.campaign_id, type: 'reply' })
    .expect(200);
  await agent
    .post('/record_campaign_event')
    .send({ campaign_id: camp.body.campaign_id, type: 'click' })
    .expect(200);

  const evCount = await CampaignEvent.countDocuments({ campaign_id: campaign._id });
  console.log('events logged', evCount);

  const result: any = await CampaignResult.findOne({ campaign_id: campaign._id }).lean();
  console.log('aggregates', result?.replies_7d, result?.clicks_7d);
  if (result?.replies_7d !== 1 || result?.clicks_7d !== 1) {
    throw new Error('aggregation failed');
  }

  console.log('snapshot title', campaign.snapshot?.web_enrichment?.title);

  const snapshot = await agent
    .get('/get_company_snapshot')
    .query({ company_id: 'c1' })
    .expect(200);
  console.log('snapshot', snapshot.body.company.name);

  console.log('e2e flow completed');

  await mongoose.disconnect();
  await mongo.stop();
}

main();
