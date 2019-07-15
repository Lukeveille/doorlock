import mongoose from 'mongoose';
import User from './api/models/user';
import distanceInM from './distance';

const socket = socket => {
  console.log('new socket open');
  socket.setDistance = 5;
  socket.homeCoords = {};
  socket.currentCoords = {};
  socket.distance = () => {
    return Math.floor(distanceInM(
      socket.homeCoords.lat,
      socket.homeCoords.long,
      socket.currentCoords.lat,
      socket.currentCoords.long
    ));
  };
  socket.newLog = (event, status) => {
    const newLog = { event, status, timestamp: Date.now() };
    socket.currentUser.logs.push(newLog)
    socket.currentUser.save().then(() => {
      console.log('User with ip ' + socket.ip + ' has ' + event);
    }).catch(err => {
      console.log(err);
    });
  }

  socket.on('login', data => {
    socket.ip = data.ip;
    User.find({ ip: socket.ip })
    .exec()
    .then(user => {
      if (!user.length) {
        const user = new User({...data,
          _id: new mongoose.Types.ObjectId(),
          logs: [{ event: 'user created', status: 'home', timestamp: Date.now() }] 
        })
        user.save().then(() => {
          console.log('New User created with ip ' + data.ip + '!');
        }).catch(err => {
          console.log(err);
        });
        socket.currentUser = user;
      } else {
        socket.homeCoords = user[0].homeCoords;
        socket.currentCoords = data.coords;
        const status = socket.distance() > socket.setDistance? 'not home' : 'home';
        socket.currentUser = user[0];
        socket.newLog('logged in', status);
        socket.emit('new-home-display', { homeCoords: socket.homeCoords });
        socket.emit('new-current-display', { coords: data.coords });
        socket.emit('distance', { distance: socket.distance(), setDistance: socket.setDistance });
      };
    });
  });
  
  socket.on('new-coords', data => {
    const currentStatus = socket.currentUser? socket.currentUser.logs[socket.currentUser.logs.length-1].status : '';
    socket.currentCoords = data.coords;
    socket.emit('distance', { distance: socket.distance(), setDistance: socket.setDistance });
    socket.emit('new-current-display', { coords: data.coords });

    if (currentStatus === 'home' && socket.distance() > socket.setDistance) {
      socket.newLog('left home', 'not home');
      socket.emit('left-home', { message: 'Lock your door!' })
    } else if (currentStatus === 'not home' && socket.distance() < socket.setDistance) {
      socket.newLog('returned home', 'home');
    };
  });

  socket.on('new-home', () => {
    socket.currentUser.homeCoords = socket.currentCoords;
    socket.newLog('updated', 'home');
    socket.emit('new-home-display', { homeCoords: socket.currentUser.homeCoords });
    socket.emit('distance', { distance: 0, setDistance: socket.setDistance });
  });
};

export default socket;