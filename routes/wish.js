const express = require('express');
const router = express.Router();
const auth = require('../middlewares/user-middleware');
const Wish = require('../schemas/wishes');
const Product = require('../schemas/products');

/** 위시리스트 등록 및 삭제 */
router.post('/:p_No', auth, async (req, res) => {
  try {
    const { p_No } = req.params;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** db.wish에 해당 u_Idx의 p_No 있나 찾음 */
    const db = await Wish.findOne({ u_Idx, p_No }).exec();
    const recentLike = await Product.find({ p_No }, { _id: 0 }).exec();

    let cnt = 0;
    if (db == null) {
      /** db에 존재하지 않으면 u_Idx, p_No 생성 후 p_Like+1 */
      await Wish.create({ u_Idx, p_No });
      cnt = recentLike[0]['p_Like'] + 1;
    } else {
      /** db에 존재하면 u_Idx, p_No 삭제 후 p_Like-1 */
      await Wish.deleteOne({ u_Idx, p_No });
      cnt = recentLike[0]['p_Like'] - 1;
    }
    /** 조건문 통과한 p_Like 수정 */
    await Product.updateOne({ p_No }, { $set: { p_Like: cnt } });

    res.status(201).send({
      success: true,
      message: 'wish success',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
