const express = require('express');
const router = express.Router();
const Product = require('../schemas/products');
const Cart = require('../schemas/carts');
const User = require('../schemas/users');
const Wish = require('../schemas/wishes');
const Keyword = require('../schemas/keywords');

/** 장바구니 저장 */
router.post('/', async (req, res) => {
  try {
    const { u_Idx, cartList } = req.body;
    /** u_Idx 기준으로 cart에 기존 db 있는지 확인 */
    let db = await Cart.find({ u_Idx }).exec();

    if (db != null) {
      await Cart.deleteOne({ u_Idx });
    }

    await Cart.create({ u_Idx, cartList });
    res.status(201).json({
      success: true,
      message: 'post success',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errorMessage: '장바구니 등록 실패',
    });
  }
});

/** 장바구니 조회 */

module.exports = router;
