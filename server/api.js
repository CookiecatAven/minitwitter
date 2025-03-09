const {checkSchema, validationResult} = require('express-validator');
const {initializeDatabase, queryDB, insertDB} = require('./database');

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
  res.json(tweets);
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
  const text = req.body.text;

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
                 WHERE username = '${username}'
                   AND password = '${password}'`;
  const user = await queryDB(db, query);
  if (user.length === 1) {
    res.json(user[0]);
  } else {
    res.json(null);
  }
};

module.exports = { initializeAPI };
