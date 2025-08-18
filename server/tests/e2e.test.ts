import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/server.js';
import { CampaignEvent, Campaign } from '../src/models/index.js';

async function main() {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGO_URI = uri;
  await mongoose.connect(uri);

  const agent = request(app);

  await agent
    .post('/save_company_profile')
    .send({ company_id: 'c1', name: 'Acme' })
    .expect(200);

  for (let i = 0; i < 3; i++) {
    await agent
      .post('/save_customer')
      .send({
        customer_id: `cust${i}`,
        company_id: 'c1',
        phone: `+1000000000${i}`,
      })
      .expect(200);
  }

  await agent
    .post('/start_web_enrichment')
    .send({
      company_id: 'c1',
      sources: [{ kind: 'website', url: 'https://example.com' }],
    })
    .expect(200);

  // run worker
  await import('../worker/enrichment.js');

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
    .send({ company_id: 'c1', brief: 'hi', message: 'hello' })
    .expect(200);

  const campaign = await Campaign.findOne({ campaign_id: camp.body.campaign_id });
  await CampaignEvent.create({
    campaign_id: campaign?._id,
    company_id: campaign?.company_id,
    type: 'reply',
  });
  await CampaignEvent.create({
    campaign_id: campaign?._id,
    company_id: campaign?.company_id,
    type: 'click',
  });

  console.log('e2e flow completed');

  await mongoose.disconnect();
  await mongo.stop();
}

main();
