import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/really';

export async function connect() {
  await mongoose.connect(uri);
}

export async function disconnect() {
  await mongoose.disconnect();
}

export default mongoose;
