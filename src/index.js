require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions/StringSession");
const { NewMessage } = require("telegram/events");
const readline = require("readline");
const mongoose = require("mongoose");
const TimeOff = require("./models/timeoff");

const apiId = process.env.API_ID;
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.SESSION_STRING || "");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

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

      if (String(chat?.id?.value) === process.env.TELEGRAM_TIME_OFF_GROUP_ID) {
        const timeOffData = {
          userId: Number(sender.id.value),
          username: sender.username,
          message: message.text,
          currentDate: new Date(),
        };

        const timeOff = new TimeOff(timeOffData);
        await timeOff.save();
        console.log("Saved to MongoDB:", timeOffData);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, new NewMessage({}));

  console.log("Connected and listening...");
  console.log("Session:", client.session.save());
  await client.sendMessage("me", { message: "Connected!" });
})();
