import { Schema, model, Document } from 'mongoose';

const OptInSchema = new Schema(
  {
    sms: { type: Boolean, default: false },
    sms_ts: Date,
    email: { type: Boolean, default: false },
    email_ts: Date,
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    customer_id: { type: String, unique: true, index: true },
    company_id: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: String,
    phone: String,
    email: String,
    opt_in: OptInSchema,
  },
  { timestamps: true }
);

CustomerSchema.index({ company_id: 1, phone: 1 }, { unique: true });

export interface CustomerDoc extends Document {}
export const Customer = model<CustomerDoc>('Customer', CustomerSchema);
