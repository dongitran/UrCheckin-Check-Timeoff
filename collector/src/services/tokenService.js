const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  try {
    const expirationTime = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
    return jwt.sign(
      {
        userId,
        exp: expirationTime,
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
      }
    );
  } catch (error) {
    throw new Error('Token generation failed: ' + error.message);
  }
};

module.exports = { generateToken };
