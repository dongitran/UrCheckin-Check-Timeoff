const mongoose = require("mongoose");

const timeOffSchema = new mongoose.Schema({
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

module.exports = mongoose.model("TimeOff", timeOffSchema);
