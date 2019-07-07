import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  ip: { type: String, required: true, unique: true },
  logs: { type: Array },
  homeCoords: { type: Object, required: true },
});

const User = mongoose.model('User', userSchema);

export default User;