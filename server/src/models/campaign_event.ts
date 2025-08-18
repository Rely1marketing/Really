import { Schema, model, Document } from 'mongoose';

const CampaignEventSchema = new Schema(
  {
    campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    type: { type: String, required: true },
    occurred_at: { type: Date, default: Date.now },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

CampaignEventSchema.index({ company_id: 1, occurred_at: -1 });

export interface CampaignEventDoc extends Document {}
export const CampaignEvent = model<CampaignEventDoc>(
  'CampaignEvent',
  CampaignEventSchema
);
