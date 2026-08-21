const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

test('protect accepts a valid bearer token', async () => {
  process.env.PORT = '5000';
  process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/tradelink-test';
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  delete require.cache[require.resolve('../config/env')];
  delete require.cache[require.resolve('../middleware/auth')];

  const { protect } = require('../middleware/auth');
  const userId = '507f1f77bcf86cd799439011';
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  await new Promise((resolve, reject) => {
    protect(req, {}, error => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  assert.equal(req.user.id, userId);
});
