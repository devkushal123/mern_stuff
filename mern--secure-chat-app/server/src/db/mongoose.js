import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDB() {
  /***
   * mongoose.set('strictQuery', true); is a global setting introduced in Mongoose 6.x to control how filter queries behave when you pass fields that are not defined in your schema.
   * If you try to query with an unknown field, Mongoose ignores it instead of sending it to MongoDB
   * Example:
   * 
        User schema has { name, email }
        await User.find({ name: 'Alice', unknownField: 'test' });
        With strictQuery: true → 'unknownField' is ignored


        When strictQuery: false:
        Mongoose passes all fields in the query to MongoDB, even if they’re not in the schema.
        This can lead to unexpected results or security issues if user input is not validated.
   * 
   * */ 

  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log('✅ MongoDB connected');
}
