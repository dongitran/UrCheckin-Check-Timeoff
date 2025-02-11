require("dotenv").config();
const connectDB = require("./config/database");
const MessageCollector = require("./services/messageCollector");
const logger = require("./utils/logger");

const startCollector = async () => {
  try {
    console.log('Collector service starting...');
    await connectDB();
    const collector = new MessageCollector();
    await collector.initialize();

    const pollMessages = async () => {
      try {
        await collector.fetchMessages();
      } catch (error) {
        logger.error("Error in message collection cycle:", {
          error: error.message,
          stack: error.stack,
        });
      } finally {
        setTimeout(pollMessages, process.env.POLL_INTERVAL);
      }
    };

    pollMessages();
  } catch (error) {
    logger.error("Fatal error in collector service:", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

startCollector();

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  logger.error("Unhandled rejection:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
