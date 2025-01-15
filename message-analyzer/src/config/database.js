const mongoose = require("mongoose");

const RETRY_DELAY = 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      heartbeatFrequencyMS: 30000,
      retryWrites: true,
      maxPoolSize: 10,
      socketTimeoutMS: 30000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
    setTimeout(connectDB, RETRY_DELAY);
  }
};

module.exports = { connectDB };
