import { Company, Customer, Campaign, CampaignEvent, CampaignResult, WebSource, WebDiff } from './models';

export async function ensureIndexes() {
  await Promise.all([
    Company.syncIndexes(),
    Customer.syncIndexes(),
    Campaign.syncIndexes(),
    CampaignEvent.syncIndexes(),
    CampaignResult.syncIndexes(),
    WebSource.syncIndexes(),
    WebDiff.syncIndexes(),
  ]);
}
