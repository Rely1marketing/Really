import express from 'express';
import { z } from 'zod';
import { connect } from './db.js';
import {
  Company,
  Customer,
  Campaign,
  CampaignEvent,
  CampaignResult,
  WebSource,
  WebDiff,
} from './models/index.js';
import { ensureIndexes } from './initIndexes.js';
import { randomUUID } from 'crypto';
import { getPolicyStatus } from './policy.js';

const app = express();
app.use(express.json());

// save_company_profile
const companySchema = z.object({
  company_id: z.string(),
  name: z.string(),
  channels: z.array(z.string()).optional(),
  brand_tone: z.string().optional(),
  locales: z.array(z.string()).optional(),
  locations: z
    .array(
      z.object({
        address: z.string(),
        hours: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

app.post('/save_company_profile', async (req, res) => {
  try {
    const data = companySchema.parse(req.body);
    const doc = await Company.findOneAndUpdate(
      { company_id: data.company_id },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// save_customer
const customerSchema = z.object({
  customer_id: z.string(),
  company_id: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  tags: z.array(z.string()).optional(),
  opt_in: z
    .object({
      sms: z.boolean().optional(),
      sms_ts: z.string().datetime().optional(),
      email: z.boolean().optional(),
      email_ts: z.string().datetime().optional(),
    })
    .optional(),
});

app.post('/save_customer', async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);
    const doc = await Customer.findOneAndUpdate(
      { customer_id: data.customer_id },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// record_campaign
const campaignSchema = z.object({
  company_id: z.string(),
  campaign_id: z.string().optional(),
  brief: z.string().optional(),
  message: z.string().optional(),
});

app.post('/record_campaign', async (req, res) => {
  try {
    const data = campaignSchema.parse(req.body);
    const campaign_id = data.campaign_id || randomUUID();
    const campaign = await Campaign.create({ ...data, campaign_id });
    await CampaignEvent.create({
      campaign_id: campaign._id,
      company_id: campaign.company_id,
      type: 'campaign_created',
    });
    res.json({ campaign_id });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// record_campaign_results
const resultSchema = z.object({
  campaign_id: z.string(),
  replies_7d: z.number().default(0),
  clicks_7d: z.number().default(0),
  bookings_7d: z.number().default(0),
});

app.post('/record_campaign_results', async (req, res) => {
  try {
    const data = resultSchema.parse(req.body);
    const campaign = await Campaign.findOne({ campaign_id: data.campaign_id });
    if (!campaign) return res.status(404).json({ error: 'campaign not found' });
    await CampaignResult.findOneAndUpdate(
      { campaign_id: campaign._id },
      { ...data, campaign_id: campaign._id },
      { upsert: true }
    );
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// start_web_enrichment
const enrichmentSchema = z.object({
  company_id: z.string(),
  sources: z.array(z.object({ kind: z.string(), url: z.string().url() })),
});

app.post('/start_web_enrichment', async (req, res) => {
  try {
    const data = enrichmentSchema.parse(req.body);
    const company = await Company.findOne({ company_id: data.company_id });
    if (!company) return res.status(404).json({ error: 'company not found' });
    let diffsCreated = 0;
    for (const src of data.sources) {
      const source = await WebSource.create({
        source_id: randomUUID(),
        company_id: company._id,
        kind: src.kind,
        url: src.url,
      });
      await WebDiff.create({
        diff_id: randomUUID(),
        company_id: company._id,
        source_id: source._id,
        diff: { title: 'Example Title from web' },
        status: 'pending',
        detected_at: new Date(),
      });
      diffsCreated++;
    }
    res.json({ status: 'queued', sources: data.sources.length, diffs: diffsCreated });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// list_web_diffs
const listDiffsSchema = z.object({ company_id: z.string() });
app.get('/list_web_diffs', async (req, res) => {
  try {
    const data = listDiffsSchema.parse(req.query);
    const company = await Company.findOne({ company_id: data.company_id });
    if (!company) return res.status(404).json({ error: 'company not found' });
    const diffs = await WebDiff.find({ company_id: company._id, status: 'pending' })
      .lean();
    res.json(diffs);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// apply_web_diff
const applyDiffSchema = z.object({ action: z.enum(['approve', 'reject']) });
app.post('/apply_web_diff/:id', async (req, res) => {
  try {
    const data = applyDiffSchema.parse(req.body);
    const diff = await WebDiff.findOne({ diff_id: req.params.id });
    if (!diff) return res.status(404).json({ error: 'diff not found' });
    diff.status = data.action === 'approve' ? 'approved' : 'rejected';
    if (data.action === 'approve') {
      diff.applied_at = new Date();
      await Company.findByIdAndUpdate(diff.company_id, { web_enrichment: diff.diff });
    }
    await diff.save();
    res.json({ status: diff.status });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// get_policy_status
const policySchema = z.object({ company_id: z.string(), channel: z.string() });
app.get('/get_policy_status', async (req, res) => {
  try {
    const data = policySchema.parse(req.query);
    const status = await getPolicyStatus(data.company_id, data.channel);
    res.json(status);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// find_customers
const findCustomersSchema = z.object({
  company_id: z.string(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  opt_in_sms: z.coerce.boolean().optional(),
});

app.get('/find_customers', async (req, res) => {
  try {
    const data = findCustomersSchema.parse(req.query);
    const company = await Company.findOne({ company_id: data.company_id });
    if (!company) return res.status(404).json({ error: 'company not found' });
    const query: any = { company_id: company._id };
    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : undefined;
    if (tags) query.tags = { $all: tags };
    if (typeof data.opt_in_sms === 'boolean') {
      query['opt_in.sms'] = data.opt_in_sms;
    }
    const customers = await Customer.find(query).lean();
    res.json(customers);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// get_company_snapshot
const snapshotSchema = z.object({ company_id: z.string() });

app.get('/get_company_snapshot', async (req, res) => {
  try {
    const data = snapshotSchema.parse(req.query);
    const company = await Company.findOne({ company_id: data.company_id }).lean();
    if (!company) return res.status(404).json({ error: 'company not found' });

    const lastCampaign = await Campaign.findOne({ company_id: company._id })
      .sort({ createdAt: -1 })
      .lean();
    let result = null;
    if (lastCampaign) {
      result = await CampaignResult.findOne({ campaign_id: lastCampaign._id }).lean();
    }

    res.json({ company, last_campaign: result });

// find_customers
const findCustomersSchema = z.object({
  company_id: z.string(),
  tags: z.union([z.string(), z.array(z.string())]).optional(),
  opt_in_sms: z.coerce.boolean().optional(),
});

app.get('/find_customers', async (req, res) => {
  try {
    const data = findCustomersSchema.parse(req.query);
    const company = await Company.findOne({ company_id: data.company_id }).lean();
    if (!company) return res.status(404).json({ error: 'company not found' });

    const query: any = { company_id: company._id };
    const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : undefined;
    if (tags) query.tags = { $all: tags };
    if (typeof data.opt_in_sms === 'boolean') {
      query['opt_in_sms'] = data.opt_in_sms;
    }

    const customers = await Customer.find(query).lean();
    res.json(customers);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
// get_company_snapshot
const snapshotSchema = z.object({ company_id: z.string() });

app.get('/get_company_snapshot', async (req, res) => {
  try {
    const data = snapshotSchema.parse(req.query);
    const company = await Company.findOne({ company_id: data.company_id }).lean();
    if (!company) return res.status(404).json({ error: 'company not found' });

    const lastCampaign = await Campaign.findOne({ company_id: company._id })
      .sort({ createdAt: -1 })
      .lean();

    let result: any = null;
    if (lastCampaign) {
      result = await CampaignResult.findOne({ campaign_id: lastCampaign._id }).lean();
    }

    res.json({ company, last_campaign: result });
main
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export async function start() {
  await connect();
  await ensureIndexes();
  const port = process.env.PORT || 3000;
  return app.listen(port, () => {
    console.log(`Server running on ${port}`);
  });
}

if (process.env.RUN_SERVER) {
  start();
}

export default app;
