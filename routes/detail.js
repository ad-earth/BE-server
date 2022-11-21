const express = require('express');
const router = express.Router();
const detailController = require('../controllers/detail');

router.get('/:p_No', detailController.getProductDetail); // 상품 상세페이지 조회

module.exports = router;
