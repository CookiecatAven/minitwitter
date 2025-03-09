require('dotenv').config();
const bcrypt = require('bcrypt');
const AesEncryption = require('aes-encryption');
const {checkSchema, validationResult} = require('express-validator');
const {initializeDatabase, queryDB, insertDB} = require('./database');
const jwt = require('jsonwebtoken');

const aes = new AesEncryption();
aes.setSecretKey(process.env.AES_ENCRYPTION_SECRET_KEY);

const tweetSchema = {
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
};

let db;

const authHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).end();
    return;
  }
  next()
};

// Implementation of a wrapper to make error handling with async functions work
// see https://stackoverflow.com/questions/29700005/express-4-middleware-error-handler-not-being-called
const asyncHandlerWrapper = handler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const initializeAPI = async (app) => {
  db = await initializeDatabase();
  app.get('/api/feed', authHandler, asyncHandlerWrapper(getFeed));
  app.post('/api/feed', authHandler, checkSchema(tweetSchema), asyncHandlerWrapper(postTweet));
  app.post('/api/login', checkSchema(loginSchema), asyncHandlerWrapper(login));
};

const getFeed = async (req, res) => {
  // check that user is present
  if (!req.user) {
    res.status(401).end();
    return;
  }

  const query = 'SELECT * FROM tweets ORDER BY id DESC';
  const tweets = await queryDB(db, query);
  const decryptedTweets = tweets.map(tweet => ({
    ...tweet, // copy all properties from tweet
    text: aes.decrypt(tweet.text) // overwrite text property with decoded text
  }));
  res.json(decryptedTweets);
};

const postTweet = async (req, res) => {
  // check that user is present and has a username
  if (!req.user?.username) {
    res.status(401).end();
    return;
  }

  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).end();
    return;
  }

  // generate timestamp on server and load data from request
  const timestamp = new Date().toISOString();
  const username = req.user.username;
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
    res.status(400).end();
    return;
  }

  const {username, password} = req.body;
  const query = `SELECT *
                 FROM users
                 WHERE username = '${username}'`;
  const users = await queryDB(db, query);
  if (users.length === 1) {
    const isPasswordValid = await bcrypt.compare(password, users[0].password);
    if (isPasswordValid) {
      // Token mit Benutzerrolle generieren
      const token = jwt.sign(
        {username: users[0].username},
        process.env.JWT_SECRET_KEY,
        {expiresIn: '1h'}
      );
      res.send(token);
    } else {
      res.status(401).end();
    }
  } else {
    res.status(401).end();
  }
};

module.exports = {initializeAPI};
