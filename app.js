import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

mongoose.connect(
  'mongodb+srv://node-shop:' +
  process.env.MONGO_PW +
  '@cluster0-fvxju.mongodb.net/test?retryWrites=true&w=majority',
  { useNewUrlParser: true }
).catch(err => console.error(err));

mongoose.Promise = global.Promise;

app.get('/', (req, res) => {
  res.render('index');
});

app.use((req, res, next) => {
  const error = new Error('Could not find what you seek');
  error.status = 404;
  next(error);
});
app.use((error, req, res) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  })
});

export default app;
