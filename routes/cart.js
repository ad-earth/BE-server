const express = require('express');
const router = express.Router();
const Product = require('../schemas/products');
const Cart = require('../schemas/carts');
const User = require('../schemas/users');
const Wish = require('../schemas/wishes');
const Keyword = require('../schemas/keywords');
const auth = require('../middlewares/user-middleware');

/** 장바구니 저장 */
router.post('/', auth, async (req, res) => {
  try {
    const { cartList } = req.body;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

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
router.get('/', auth, async (req, res) => {
  try {
    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    let cartList = await Cart.find(
      { u_Idx },
      { _id: 0, __v: 0, u_Idx: 0 },
    ).exec();

    res.status(200).json(cartList[0]);
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
