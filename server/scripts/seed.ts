import { connect, disconnect } from '../src/db.js';
import { Company, Customer } from '../src/models/index.js';

async function run() {
  await connect();
  const company = await Company.create({ company_id: 'seedco', name: 'Seed Co' });
  await Customer.insertMany([
    { customer_id: 's1', company_id: company._id, phone: '+10000000001' },
    { customer_id: 's2', company_id: company._id, phone: '+10000000002' },
    { customer_id: 's3', company_id: company._id, phone: '+10000000003' },
  ]);
  await disconnect();
}

run();
