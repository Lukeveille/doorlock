import app from './app';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log('Server running on port 3000');
});

const io = require('socket.io')(server)

app.io = io;

io.on('connection', () => {
  console.log('New user connected to socket');
});