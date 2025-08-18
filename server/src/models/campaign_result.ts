import { Schema, model, Document } from 'mongoose';

const CampaignResultSchema = new Schema(
  {
    campaign_id: { type: Schema.Types.ObjectId, ref: 'Campaign', unique: true },
    replies_7d: { type: Number, default: 0 },
    clicks_7d: { type: Number, default: 0 },
    bookings_7d: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export interface CampaignResultDoc extends Document {}
export const CampaignResult = model<CampaignResultDoc>(
  'CampaignResult',
  CampaignResultSchema
);
