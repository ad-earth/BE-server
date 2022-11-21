const express = require('express');
const router = express.Router();
const clientOrderController = require('../controllers/order');
const middleware = require('../middlewares/client-middleware');

router
  .get('/', middleware, clientOrderController.getOrders) // 주문 상품 조회
  .get('/:o_No', middleware, clientOrderController.getOrdersProduct) // 주문 상품 상세 조회
  .put('/:o_No/cancel', middleware, clientOrderController.updateOrderCancel); // 주문 상품 취소 요청

module.exports = router;
