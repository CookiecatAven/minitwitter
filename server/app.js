const express = require('express');
const rateLimit = require('express-rate-limit');
const {initializeAPI} = require('./api');
const jwt = require('jsonwebtoken');

// Create the express server
const app = express();

const buildApp = async () => {
  // Remove hint in responses about Express being used as a framework
  app.disable('x-powered-by');
  // Parse Bearer Token
  app.use(async (req, res, next) => {
    // Extract JWT from authorization header
    const authHeader = req.headers.authorization;
    // Check if header contains a bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Get token after "Bearer "
      const token = authHeader.split(' ')[1];
      // Validate token
      await jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (!err) {
          req.user = decoded;
        }
      });
    }
    next();
  });
  // Deliver static files from the client folder like css, js, images - this is exempt from rate limiting on purpose
  app.use(express.static('client'));
  // Implement rate limiter for api requests - max 10 requests per 10 seconds
  app.use(rateLimit({
    windowMs: 10 * 1000, max: 10
  }));
  // Parse JSON body
  app.use(express.json());

  // Initialize the REST api
  await initializeAPI(app);

  // Implement error handler
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    console.error(`Exception handling request: ${err.stack}`);
    res.status(500).end();
  });
};

buildApp().then(() => {
  //start the web server
  const serverPort = process.env.PORT || 3000;
  app.listen(serverPort, () => {
    console.log(`Express Server started on port ${serverPort}`);
  });
});
