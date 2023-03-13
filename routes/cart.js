const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const middleware = require('../middlewares/client-middleware');

router
  .get('/', middleware, cartController.getCart) // 장바구니 조회
  .put('/:c_Type', middleware, cartController.updateCart) // 장바구니 업데이트
  .delete('/:c_Type', middleware, cartController.deleteCart); // 장바구니 삭제

module.exports = router;
