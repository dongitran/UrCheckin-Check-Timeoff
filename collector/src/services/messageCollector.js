const axios = require("axios");
const TimeOffMessage = require("../models/TimeOffMessage");
const logger = require("../utils/logger");
const { generateToken } = require("./tokenService");

class MessageCollector {
  constructor() {
    this.lastProcessedId = null;
  }

  async initialize() {
    const lastMessage = await TimeOffMessage.findOne().sort({ createdAt: -1 });
    if (lastMessage) {
      this.lastProcessedId = lastMessage._id;
    }
  }

  async fetchMessages() {
    try {
      const token = generateToken(process.env.USER_ID);
      const response = await axios.get(
        `${process.env.API_URL}?userId=${process.env.USER_ID}&chatId=${process.env.CHAT_ID}`,
        {
          headers: { authorization: token },
        }
      );

      if (response.data.success && response.data.data) {
        await this.processMessages(response.data.data);
      }
    } catch (error) {
      logger.error("Error fetching messages:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  async processMessages(messages) {
    try {
      for (const message of messages) {
        if (!this.lastProcessedId || message._id > this.lastProcessedId) {
          await TimeOffMessage.create({
            userId: message.fromId,
            username: message.fromUserName,
            message: message.content,
            currentDate: message.createdAt,
            createdAt: new Date(),
          });
        }
      }

      if (messages.length > 0) {
        this.lastProcessedId = messages[0]._id;
      }
    } catch (error) {
      logger.error("Error processing messages:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

module.exports = MessageCollector;
