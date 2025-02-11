const mongoose = require("mongoose");

const timeOffMessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TimeOffMessage", timeOffMessageSchema);
