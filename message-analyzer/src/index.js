require('dotenv').config();
const { processMessages } = require('./services/messageProcessor');
const { connectDB } = require('./config/database');

const PROCESSING_INTERVAL = parseInt(process.env.PROCESSING_INTERVAL) || 60000;

async function start() {
  try {
    await connectDB();
    await processMessages();
    setInterval(async () => {
      await processMessages();
    }, PROCESSING_INTERVAL);

    console.log('Message analyzer service started');
  } catch (error) {
    console.error('Error starting service:', error);
    process.exit(1);
  }
}

start();