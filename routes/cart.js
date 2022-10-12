const express = require('express');
const router = express.Router();
const Cart = require('../schemas/carts');
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
    return res.status(201).send({
      success: true,
      message: 'post success',
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      errorMessage: '장바구니 등록 실패',
    });
  }
});

module.exports = router;
