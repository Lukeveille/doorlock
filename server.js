import app from './app';
import socket from './socket';
// import fs from 'fs';
// import https from 'https';

// const options = {
//   cert: fs.readFileSync('./cert.pem'),
//   key: fs.readFileSync('./keytmp.pem')
// }

const port = process.env.PORT || 3443;

// const httpsServer = https.createServer(options, app)
// .listen(port, () => {
//   console.log('Server running on port ' + port);
// });

const server = app.listen(port, () => {
  console.log('Server running on port ' + port);
});

const io = require('socket.io')(server);

app.io = io;

io.on('connection', socket);