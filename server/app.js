const express = require('express');
const http = require('http');
const {initializeAPI} = require('./api');

// Create the express server
const app = express();
// Remove hint in responses about Express being used as a framework
app.disable('x-powered-by');
app.use(express.json());
const server = http.createServer(app);

// deliver static files from the client folder like css, js, images
app.use(express.static('client'));

// Initialize the REST api
initializeAPI(app);

//start the web server
const serverPort = process.env.PORT || 3000;
server.listen(serverPort, () => {
  console.log(`Express Server started on port ${serverPort}`);
});
