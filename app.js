const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const port = 3005;

/** Router */
const userRouter = require('./routes/user');

/** DB */
const connect = require('./schemas');
connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('This is server of adEarth');
});

app.use('/users', express.urlencoded({ extended: false }), userRouter);

app.listen(port, () => console.log(`http://localhost:${port}`));

module.exports = app;
