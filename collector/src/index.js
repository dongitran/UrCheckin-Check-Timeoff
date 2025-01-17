require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions/StringSession");
const { NewMessage } = require("telegram/events");
const readline = require("readline");
const mongoose = require("mongoose");
const TimeOffMessage = require("./models/timeoffMessage");
const TelegramMessage = require("./models/telegramMessage");

const apiId = process.env.API_ID;
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.SESSION_STRING || "");

const RETRY_DELAY = 5000;
const messageBuffer = [];
const allMessageBuffer = [];
const MAX_BUFFER_SIZE = 1000;

const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      heartbeatFrequencyMS: 30000,
      retryWrites: true,
      maxPoolSize: 10,
      socketTimeoutMS: 30000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log(`Retrying connection in ${RETRY_DELAY / 1000} seconds...`);
    setTimeout(connectWithRetry, RETRY_DELAY);
  }
};

const db = mongoose.connection;

db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.on("disconnected", () => {
  console.log("MongoDB disconnected, retrying in 5 seconds...");
  setTimeout(connectWithRetry, RETRY_DELAY);
});

const saveTimeOffWithRetry = async (timeOffData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeOff = new TimeOffMessage(timeOffData);
      await timeOff.save();
      console.log("Saved time-off message to MongoDB:", timeOffData);
      return true;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error("Failed to save time-off message, buffering:", error);
        if (messageBuffer.length < MAX_BUFFER_SIZE) {
          messageBuffer.push(timeOffData);
          console.log(
            `Time-off message buffered. Buffer size: ${messageBuffer.length}`
          );
        } else {
          console.error(
            "Time-off message buffer full, dropping oldest message"
          );
          messageBuffer.shift();
          messageBuffer.push(timeOffData);
        }
        return false;
      }
      console.log(`Save attempt ${attempt} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

const saveTelegramMessageWithRetry = async (messageData, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const message = new TelegramMessage(messageData);
      await message.save();
      console.log("Saved telegram message to MongoDB:", messageData);
      return true;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error("Failed to save telegram message, buffering:", error);
        if (allMessageBuffer.length < MAX_BUFFER_SIZE) {
          allMessageBuffer.push(messageData);
          console.log(
            `Telegram message buffered. Buffer size: ${allMessageBuffer.length}`
          );
        } else {
          console.error(
            "Telegram message buffer full, dropping oldest message"
          );
          allMessageBuffer.shift();
          allMessageBuffer.push(messageData);
        }
        return false;
      }
      console.log(`Save attempt ${attempt} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

db.on("connected", async () => {
  if (messageBuffer.length > 0) {
    console.log(
      `Processing ${messageBuffer.length} buffered time-off messages...`
    );
    while (messageBuffer.length > 0) {
      const data = messageBuffer.shift();
      await saveTimeOffWithRetry(data);
    }
  }

  if (allMessageBuffer.length > 0) {
    console.log(
      `Processing ${allMessageBuffer.length} buffered telegram messages...`
    );
    while (allMessageBuffer.length > 0) {
      const data = allMessageBuffer.shift();
      await saveTelegramMessageWithRetry(data);
    }
  }
});

connectWithRetry();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

(async () => {
  const client = new TelegramClient(stringSession, Number(apiId), apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () =>
      await new Promise((resolve) => rl.question("Phone number: ", resolve)),
    password: async () =>
      await new Promise((resolve) => rl.question("Password: ", resolve)),
    phoneCode: async () =>
      await new Promise((resolve) => rl.question("Code: ", resolve)),
    onError: (err) => console.log(err),
  });

  client.addEventHandler(async (event) => {
    try {
      const message = event.message;
      const chat = await event.message.getChat();
      const sender = await message.getSender();

      const messageData = {
        userId: Number(sender.id.value),
        username: sender.username,
        message: message.text,
        chatId: String(chat?.id?.value),
        chatTitle: chat?.title,
        chatType: chat?.className,
        currentDate: new Date(),
      };
      await saveTelegramMessageWithRetry(messageData);

      if (String(chat?.id?.value) === process.env.TELEGRAM_TIME_OFF_GROUP_ID) {
        const timeOffData = {
          userId: Number(sender.id.value),
          username: sender.username,
          message: message.text,
          currentDate: new Date(),
        };
        await saveTimeOffWithRetry(timeOffData);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, new NewMessage({}));

  console.log("Connected and listening...");
  console.log("Session:", client.session.save());
  await client.sendMessage("me", { message: "Connected!" });
})();
