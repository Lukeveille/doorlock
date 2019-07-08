import express from 'express';
import mongoose from 'mongoose';
import User from '../models/user';
import distanceInM from '../../distance';

const userRouter = express.Router();
const setDistance = 200;

userRouter.post('/', (req, res) => {
  User.find({ ip: req.body.ip })
  .exec()
  .then(user => {
    if (!user.length) {
      console.log("New User created with ip " + req.body.ip + "!");
      const user = new User({...req.body,
        _id: new mongoose.Types.ObjectId(),
        logs: [{ event: 'user created', status: 'home', timestamp: Date.now() }]
      });
      user.save().then(() => {
        res.status(200).json({
          homeCoords: req.body.homeCoords
        });
      }).catch(err => {
        res.status(500).json({ error: err });
      });
    } else {
      console.log("User with ip " + req.body.ip + " has logged in");
      
      const status = Math.floor(distanceInM(
        user[0].homeCoords.lat,
        user[0].homeCoords.long,
        req.body.homeCoords.lat,
        req.body.homeCoords.long
      )) > setDistance? 'not home' : 'home';

      const newLog = { event: 'logged in', status, timestamp: Date.now() };

      user[0].logs.push(newLog)

      user[0].save().then(() => {
        res.status(200).json({
          homeCoords: user[0].homeCoords
        });
      }).catch(err => {
        res.status(500).json({ error: err });
      });
    };
  });
});

userRouter.post('/:ip', (req, res) => {
  User.find({ ip: req.params.ip })
  .exec()
  .then(user => {
    const distance = Math.floor(distanceInM(
      user[0].homeCoords.lat,
      user[0].homeCoords.long,
      req.body.coords.lat,
      req.body.coords.long
    ));
    const currentStatus = user[0].logs[user[0].logs.length-1].status;
    if (currentStatus === 'home' && distance > setDistance) {
      user[0].logs.push({ event: 'left home', status: 'not home', timestamp: Date.now() });
      user[0].save().catch(err => {
        res.status(500).json({ error: err });
      });
      req.app.io.sockets.emit('left_home', { ip: req.params.ip });
      console.log('User with ip ' + req.params.ip + ' left home')
    } else if (currentStatus === 'not home' && distance < setDistance) {
      user[0].logs.push({ event: 'returned home', status: 'home', timestamp: Date.now() });
      user[0].save().catch(err => {
        res.status(500).json({ error: err });
      });
      console.log('User with ip ' + req.params.ip + ' returned home')
    }
    res.status(200).json({ distance });
  }).catch(err => {
    res.status(500).json({ error: err });
  });
});

userRouter.put('/:ip', (req, res) => {
  User.find({ ip: req.params.ip })
  .exec()
  .then(user => {
    const newLog = { event: 'new home co-ordinates', status: 'home', timestamp: Date.now() };

    user[0].homeCoords = req.body.homeCoords
    user[0].logs.push(newLog)

    console.log("User with ip " + req.params.ip + " updated!");

    user[0].save().then(() => {
      res.status(200).json({
        message: 'user updated'
      });
    }).catch(err => {
      res.status(500).json({ error: err });
    });
  }).catch(err => {
    res.status(500).json({ error: err });
  });
});

export default userRouter;