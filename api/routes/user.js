import express from 'express';
import User from '../models/user';
import distanceInM from '../../distance';

const userRouter = express.Router();
const setDistance = 10;

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
      req.app.io.sockets.emit('left-home', { ip: req.params.ip });
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