import express from 'express';
import mongoose from 'mongoose';
import User from '../models/user';
import distanceInM from '../../distance';

const userRouter = express.Router();

userRouter.post('/:ip', (req, res) => {
  User.find({ ip: req.params.ip })
  .exec()
  .then(user => {
    let distance = Math.floor(distanceInM(
      user[0].homeCoords.lat,
      user[0].homeCoords.long,
      req.body.coords.lat,
      req.body.coords.long
    ));
    console.log(distance);
    if (distance > 1) {
      req.app.io.sockets.emit('left_home', {});
    }
    res.status(200).json({ distance });
  }).catch(err => {
    res.status(500).json({ error: err });
  });
});

userRouter.put('/:ip', (req, res) => {
  User.updateOne({ ip: req.params.ip }, req.body)
  .exec()
  .then(() => {
    console.log("User with ip " + req.params.ip + " updated!");
    res.status(200).json({
      message: 'user updated'
    });
  }).catch(err => {
    res.status(500).json({ error: err });
  });
});

userRouter.post('/', (req, res) => {
  User.find({ ip: req.body.ip })
  .exec()
  .then(user => {
    if (!user.length) {
      console.log("New User created with ip " + req.body.ip + "!");
      const user = new User({...req.body,
        _id: new mongoose.Types.ObjectId()
      });
      user.save().then(() => {
        res.status(200).json({
          homeCoords: req.body.homeCoords
        });
      }).catch(err => {
        res.status(500).json({ error: err });
      });
    } else {
      console.log("User with ip " + req.body.ip + " has connected!");
      res.status(200).json({
        homeCoords: user[0].homeCoords
      });
    }
  });
});

export default userRouter;