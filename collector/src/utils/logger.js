const winston = require('winston');
require('winston-mongodb');

const logger = winston.createLogger({
  transports: [
    new winston.transports.MongoDB({
      db: process.env.MONGODB_URI,
      collection: 'logs',
      level: 'error',
      options: { useUnifiedTopology: true }
    })
  ]
});

module.exports = logger;
