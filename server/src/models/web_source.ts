import { Schema, model, Document } from 'mongoose';

const WebSourceSchema = new Schema(
  {
    source_id: { type: String, unique: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    kind: { type: String, required: true },
    url: { type: String, required: true },
    etag: String,
    last_checked: Date,
  },
  { timestamps: true }
);

WebSourceSchema.index({ company_id: 1, kind: 1 });

export interface WebSourceDoc extends Document {}
export const WebSource = model<WebSourceDoc>('WebSource', WebSourceSchema);
