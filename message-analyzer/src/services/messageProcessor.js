const TimeOffMessage = require("../models/timeoffMessage");
const { analyzeMessage } = require("./openaiService");

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10;

async function processMessages() {
  try {
    const messages = await TimeOffMessage.find(
      { analyzed: { $exists: false } },
      { message: 1, currentDate: 1 }
    ).limit(BATCH_SIZE);

    if (messages.length === 0) {
      return;
    }

    console.log(`Processing ${messages.length} messages`);

    for (const message of messages) {
      try {
        const messageData = {
          message: message.message,
          currentDate: message.currentDate,
        };

        const result = await analyzeMessage(messageData);

        message.analyzed = true;
        message.analyzedResult =
          result.results.length > 0 ? result.results : [];
        message.analyzedAt = new Date();
        message.tokenUsage = result.usage;
        await message.save();

        console.log(
          `Analyzed message ${new Date(message.currentDate).toISOString()}-${
            message.message
          }: ${JSON.stringify(result.results, null, 2)}`
        );
        console.log(`Token usage:`, result.usage);
      } catch (error) {
        console.error(`Error processing message ${message._id}:`, error);

        message.analyzed = true;
        message.error = error.message;
        message.analyzedAt = new Date();
        await message.save();
      }
    }
  } catch (error) {
    console.error("Error in message processor:", error);
  }
}

module.exports = { processMessages };
