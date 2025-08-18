import { Schema, model, Document } from 'mongoose';

const WebDiffSchema = new Schema(
  {
    diff_id: { type: String, unique: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    source_id: { type: Schema.Types.ObjectId, ref: 'WebSource', required: true },
    diff: Schema.Types.Mixed,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    detected_at: { type: Date, default: Date.now },
    applied_at: Date,
  },
  { timestamps: true }
);

WebDiffSchema.index({ company_id: 1, status: 1, detected_at: -1 });

export interface WebDiffDoc extends Document {}
export const WebDiff = model<WebDiffDoc>('WebDiff', WebDiffSchema);
