import mongoose from "mongoose";

export async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/redis-cache-demo");
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection failed", err);
  }
}
