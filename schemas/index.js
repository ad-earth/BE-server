const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const localDB = process.env.DB_DEV;
const devDB = process.env.DB_PRODUCTION;

const connect = () => {
  mongoose
    .connect(localDB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .catch(err => console.log(err));
};

mongoose.connection.on('error', err => {
  console.error('몽고디비 연결 에러', err);
});

module.exports = connect;
