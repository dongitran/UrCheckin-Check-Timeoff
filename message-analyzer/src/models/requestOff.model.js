const mongoose = require("mongoose");

const requestOffSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    dateOff: {
      type: Date,
      required: true,
    },
    requestId: {
      type: String,
      required: false,
    },
    timeOffType: {
      type: String,
      enum: ["MORNING", "AFTERNOON", "FULL_DAY"],
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RequestOff", requestOffSchema);