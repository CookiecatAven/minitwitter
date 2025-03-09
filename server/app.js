const express = require('express');
const http = require('http');
const rateLimit = require('express-rate-limit');
const {initializeAPI} = require('./api');

// Create the express server
const app = express();
// Remove hint in responses about Express being used as a framework
app.disable('x-powered-by');
// Deliver static files from the client folder like css, js, images - this is exempt from rate limiting on purpose
app.use(express.static('client'));
// Implement rate limiter for api requests - max 10 requests per 10 seconds
app.use(rateLimit({
  windowMs: 10 * 1000,
  max: 10
}));
// Parse JSON body
app.use(express.json());
const server = http.createServer(app);

// Initialize the REST api
initializeAPI(app);

//start the web server
const serverPort = process.env.PORT || 3000;
server.listen(serverPort, () => {
  console.log(`Express Server started on port ${serverPort}`);
});
