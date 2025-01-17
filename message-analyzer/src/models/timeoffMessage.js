const mongoose = require("mongoose");

const timeOffMessageSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
  },
  username: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  currentDate: {
    type: Date,
    default: Date.now,
  },
  analyzed: {
    type: Boolean,
    default: false,
  },
  analyzedResult: [
    {
      date: String,
      status: {
        type: String,
        enum: ["off", "remote"],
      },
      type: {
        type: String,
        enum: ["full-day", "morning", "afternoon"],
      },
    },
  ],
  analyzedAt: Date,
  error: String,
  tokenUsage: {
    promptTokens: Number,
    completionTokens: Number,
    totalTokens: Number
  }
});

module.exports = mongoose.model("TimeOffMessage", timeOffMessageSchema);