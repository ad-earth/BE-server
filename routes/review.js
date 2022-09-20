const express = require('express');
const router = express.Router();
const Review = require('../schemas/reviews');
const auth = require('../middlewares/user-middleware');

/** 구매평 등록 */
router.post('/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;
    const { r_Score, r_Content } = req.body;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;
    const u_Id = user.u_Id;

    /** admin 판매 목록에 구매내역 있는지 확인 */
    /** 구매내역 있고 reviews = false면 댓글 작성 가능  */
    /** o_No는 현재 required false지만 어드민 완료시 true로 변경 */
    /** 댓글 번호 확인 및 생성 (보류) */
    const recentNo = await Review.find().sort('-r_No').limit(1);
    let r_No = 1;
    if (recentNo.length !== 0) {
      r_No = recentNo[0]['r_No'] + 1;
    }

    /** 날짜 생성 */
    const createdAt = new Date(+new Date() + 3240 * 10000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\..*/, '');

    await Review.create({
      r_No,
      r_Content,
      r_Score,
      u_Idx,
      p_No,
      u_Id,
      createdAt,
    });
    res.status(201).json({
      success: true,
      message: 'post success',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errorMessage: '댓글 등록 실패',
    });
  }
});

module.exports = router;
