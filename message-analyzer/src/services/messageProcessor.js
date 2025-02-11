const TimeOffMessage = require("../models/timeoffMessage");
const RequestOff = require("../models/requestOff.model");
const { analyzeMessage } = require("./openaiService");

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 10;

async function processMessages() {
  try {
    const messages = await TimeOffMessage.find(
      { analyzed: { $exists: false } },
      { userId: 1, message: 1, currentDate: 1 }
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

        for (const result of message.analyzedResult) {
          await RequestOff.create({
            userId: String(message.userId),
            dateOff: `${result.date}T00:00:00.000+00:00`,
            requestId: message?._id,
            timeOffType: result.type,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

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
