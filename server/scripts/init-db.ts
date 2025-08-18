import { connect, disconnect } from '../src/db.js';
import {
  Company,
  Customer,
  Campaign,
  CampaignResult,
  CampaignEvent,
  WebSource,
  WebDiff,
} from '../src/models/index.js';

async function run() {
  await connect();
  await Promise.all([
    Company.syncIndexes(),
    Customer.syncIndexes(),
    Campaign.syncIndexes(),
    CampaignResult.syncIndexes(),
    CampaignEvent.syncIndexes(),
    WebSource.syncIndexes(),
    WebDiff.syncIndexes(),
  ]);
  await disconnect();
}

run();
