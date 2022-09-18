const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
const bodyParser = require('body-parser');
const morgan = require('morgan');
const port = 3005;

/** Router */
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const productRouter = require('./routes/product');
const keywordRouter = require('./routes/keyword');
const mainRouter = require('./routes/main');
const wishRouter = require('./routes/wish');

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
app.use('/admins', express.urlencoded({ extended: false }), adminRouter);
app.use(
  '/admin-products',
  express.urlencoded({ extended: false }),
  productRouter,
);
app.use(
  '/admin-keywords',
  express.urlencoded({ extended: false }),
  keywordRouter,
);
app.use('/main', express.urlencoded({ extended: false }), mainRouter);
app.use('/wish-list', express.urlencoded({ extended: false }), wishRouter);

app.listen(port, () => console.log(`http://localhost:${port}`));

module.exports = app;
