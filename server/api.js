require('dotenv').config();
const bcrypt = require('bcrypt');
const AesEncryption = require('aes-encryption');
const {checkSchema, validationResult} = require('express-validator');
const {initializeDatabase, queryDB, insertDB} = require('./database');

const aes = new AesEncryption();
aes.setSecretKey(process.env.AES_ENCRYPTION_SECRET_KEY);

const tweetSchema = {
  username: {
    trim: true,
    escape: true,
    notEmpty: true
  },
  text: {
    trim: true,
    escape: true,
    notEmpty: true
  }
};

const loginSchema = {
  username: {
    trim: true,
    escape: true,
    notEmpty: true
  },
  password: {
    notEmpty: true
  }
}

let db;

const initializeAPI = async (app) => {
  db = await initializeDatabase();
  app.get('/api/feed', getFeed);
  app.post('/api/feed', checkSchema(tweetSchema), postTweet);
  app.post('/api/login', checkSchema(loginSchema), login);
};

const getFeed = async (req, res) => {
  const query = 'SELECT * FROM tweets ORDER BY id DESC';
  const tweets = await queryDB(db, query);
  const decryptedTweets = tweets.map(tweet => ({
    ...tweet, // copy all properties from tweet
    text: aes.decrypt(tweet.text) // overwrite text property with decoded text
  }))
  res.json(decryptedTweets);
};

const postTweet = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send();
  }

  // generate timestamp on server and load data from request
  const timestamp = new Date().toISOString();
  const username = req.body.username;
  const text = aes.encrypt(req.body.text);

  const query = `INSERT INTO tweets (username, timestamp, text)
                 VALUES ('${username}', '${timestamp}', '${text}')`;
  await insertDB(db, query);
  res.json({status: 'ok'});
};

const login = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).end();
  }

  const {username, password} = req.body;
  const query = `SELECT *
                 FROM users
                 WHERE username = '${username}'`;
  const user = await queryDB(db, query);
  if (user.length === 1) {
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (isPasswordValid) {
      return res.json(user[0]);
    } else {
      return res.json(null);
    }
  } else {
    return res.json(null);
  }
};

module.exports = {initializeAPI};
