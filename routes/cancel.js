const express = require('express');
const router = express.Router();
const cancelController = require('../controllers/cancel');
const middleware = require('../middlewares/client-middleware');

router.get('/', middleware, cancelController.getCancelProducts); // 취소 상품 조회

module.exports = router;
