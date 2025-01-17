const mongoose = require("mongoose");

const telegramMessageSchema = new mongoose.Schema({
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
  chatId: {
    type: String,
    required: true,
  },
  chatTitle: {
    type: String,
  },
  chatType: {
    type: String,
  },
  currentDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model("TelegramMessage", telegramMessageSchema);