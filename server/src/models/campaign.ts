import { Schema, model, Document } from 'mongoose';

const CampaignSchema = new Schema(
  {
    campaign_id: { type: String, unique: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    brief: String,
    message: String,
    channel: String,
    scheduled_at: Date,
    snapshot: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export interface CampaignDoc extends Document {}
export const Campaign = model<CampaignDoc>('Campaign', CampaignSchema);
