import mongoose from 'mongoose';

import { env } from '../config/env';

//===============================================================

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed');

    if (error instanceof Error) {
      console.error(error.message);
    }

    process.exit(1);
  }
}
