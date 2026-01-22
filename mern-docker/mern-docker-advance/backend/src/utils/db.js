
import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  let attempts = 0;
  const maxAttempts = 10;
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      attempts++;
      console.error(`MongoDB connection failed (attempt ${attempts}):`, err.message);
      await delay(Math.min(5000 * attempts, 15000));
    }
  }
  throw new Error('Failed to connect to MongoDB after multiple attempts');
}
