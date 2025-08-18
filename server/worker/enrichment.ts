import { load } from 'cheerio';
import { randomUUID } from 'crypto';
import { connect, disconnect } from '../src/db.js';
import { Company, WebSource, WebDiff } from '../src/models/index.js';

async function run() {
  await connect();
  const sources = await WebSource.find().lean();
  for (const src of sources) {
    try {
      const res = await fetch(src.url);
      const html = await res.text();
      const $ = load(html);
      const title = $('title').text();
      const company = await Company.findById(src.company_id).lean();
      const current = company?.web_enrichment?.title;
      if (title && title !== current) {
        await WebDiff.create({
          diff_id: randomUUID(),
          company_id: src.company_id,
          source_id: src._id,
          diff: { title },
          status: 'pending',
          detected_at: new Date(),
        });
      }
      await WebSource.updateOne({ _id: src._id }, { last_checked: new Date() });
    } catch (err) {
      console.error('enrichment error', err);
    }
  }
  await disconnect();
}

run();
