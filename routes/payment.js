const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');
const middleware = require('../middlewares/client-middleware');

router
  .get('/', middleware, paymentController.getPaymentInfo) // 결제페이지 첫 화면
  .get('/complete', middleware, paymentController.getCompletePayment) // 결제 완료
  .post('/complete', middleware, paymentController.createPayment); // 결제 내역 생성

module.exports = router;
