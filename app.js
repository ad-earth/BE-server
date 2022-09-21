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
const detailRouter = require('./routes/detail');
const cartRouter = require('./routes/cart');
const paymentRouter = require('./routes/payment');
const shippingRouter = require('./routes/shipping');
const reviewRouter = require('./routes/review');
const orderRouter = require('./routes/order');
const cancelRouter = require('./routes/cancel');

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
app.use('/products', express.urlencoded({ extended: false }), detailRouter);
app.use('/carts', express.urlencoded({ extended: false }), cartRouter);
app.use('/payment', express.urlencoded({ extended: false }), paymentRouter);
app.use(
  '/shipping-list',
  express.urlencoded({ extended: false }),
  shippingRouter,
);
app.use('/reviews', express.urlencoded({ extended: false }), reviewRouter);
app.use('/orders', express.urlencoded({ extended: false }), orderRouter);
app.use('/cancel-list', express.urlencoded({ extended: false }), cancelRouter);

app.listen(port, () => console.log(`http://localhost:${port}`));

module.exports = app;
