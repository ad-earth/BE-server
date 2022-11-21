const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const middleware = require('../middlewares/client-middleware');

router.post('/', middleware, cartController.createCartList); // 장바구니 생성

module.exports = router;
