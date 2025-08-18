import { Schema, model, Document } from 'mongoose';

const LocationSchema = new Schema(
  {
    address: String,
    hours: [String],
  },
  { _id: false }
);

const WebEnrichmentSchema = new Schema(
  {
    services: [String],
    usps: [String],
    social: [String],
    review_themes: [String],
    title: String,
  },
  { _id: false }
);

const CompanySchema = new Schema(
  {
    company_id: { type: String, unique: true, index: true },
    name: String,
    channels: [String],
    brand_tone: String,
    locales: [String],
    locations: [LocationSchema],
    web_enrichment: WebEnrichmentSchema,
  },
  { timestamps: true }
);

export interface CompanyDoc extends Document {}
export const Company = model<CompanyDoc>('Company', CompanySchema);
