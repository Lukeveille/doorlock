import app from './app';

const port = process.env.PORT || 443;

const server = app.listen(port, () => {
  console.log('Server running on port ' + port);
});

const io = require('socket.io')(server)

app.io = io;

io.on('connection', () => {
  console.log('New user connected to socket');
});