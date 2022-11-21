const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shipping');
const middleware = require('../middlewares/client-middleware');

router
  .put('/:d_No', middleware, shippingController.updateOrderAddress) // 배송지 정보 수정
  .delete('/:d_No', middleware, shippingController.deleteOrderAddress); // 배송지 정보 삭제

module.exports = router;
