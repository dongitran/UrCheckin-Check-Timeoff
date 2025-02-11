const mongoose = require("mongoose");

const errorLogSchema = new mongoose.Schema({
  error: {
    type: String,
    required: true,
  },
  stack: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ErrorLog", errorLogSchema);
