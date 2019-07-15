import mongoose from 'mongoose';
import User from './api/models/user';
import distanceInM from './distance';

const setDistance = 10;

const socket = socket => {
  console.log('new socket open');
  let homeCoords = {};
  let currentCoords = {};
  let distance = () => {
    return Math.floor(distanceInM(
      homeCoords.lat,
      homeCoords.long,
      currentCoords.lat,
      currentCoords.long
    ));
  };
  let currentStatus = '';
  let currentUser = null;

  socket.on('login', data => {
    User.find({ ip: data.ip })
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

        currentUser = user;

      } else {
        homeCoords = user[0].homeCoords;
        currentCoords = data.coords;

        const status = distance() > setDistance? 'not home' : 'home';
        
        console.log(status);

        const newLog = { event: 'logged in', status, timestamp: Date.now() };

        user[0].logs.push(newLog)

        user[0].save().then(() => {
          console.log('User with ip ' + data.ip + ' has logged in');
        }).catch(err => {
          console.log(err);
        });

        currentUser = user[0];
        currentStatus = user[0].logs[user[0].logs.length-1].status;
        
        socket.emit('new-home-display', { homeCoords });
        socket.emit('new-current-display', { coords: data.coords });
        socket.emit('distance', { distance: distance() });
      };
    });
  });
  
  socket.on('new-coords', data => {
    currentCoords = data.coords;
    socket.emit('distance', { distance: distance() });
    socket.emit('new-current-display', { coords: data.coords });

    if (currentStatus === 'home' && distance() > setDistance) {
      const newLog = { event: 'left home', status: 'not home', timestamp: Date.now() }
      
      currentUser.logs.push(newLog);
      
      currentUser.save().then(() => {
        console.log('User with ip ' + data.ip + ' left home');
        socket.emit('left-home', { message: "Lock your door!", ip: data.ip });
      }).catch(err => {
        console.log(err);
      });
    } else if (currentStatus === 'not home' && distance() < setDistance) {
      const newLog = { event: 'returned home', status: 'home', timestamp: Date.now() }
      
      currentUser.logs.push(newLog);

      currentUser.save().then(() => {
        console.log('User with ip ' + req.params.ip + ' returned home')
      }).catch(err => {
        console.log(err);
      });
    };
  });

  socket.on('new-home', () => {
    currentUser.homeCoords = currentCoords;
    currentUser.save().then(() => {
      console.log('User with ip ' + req.params.ip + ' updated!')
    }).catch(err => {
      console.log(err);
    });
  });
};

export default socket;