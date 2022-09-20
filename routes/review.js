const express = require('express');
const router = express.Router();
const Review = require('../schemas/reviews');
const Product = require('../schemas/products');
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

    /** db.product.p_Reviews + 1 */
    let reviewsCnt = await Product.findOne({ p_No }, { p_Review: 1 }).exec();

    let prodReview = 0;
    if (reviewsCnt.p_Review == null) {
      prodReview = 1;
    } else {
      prodReview = reviewsCnt.p_Review + 1;
    }

    await Product.updateOne({ p_No }, { p_Review: prodReview });

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

/** 구매평 조회 */
router.get('/:p_No', async (req, res) => {
  try {
    const { p_No } = req.params;
    const { page, maxpost } = req.query;

    /** maxpost 수만큼 page 처리 */
    Number(page, maxpost);
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    /** 전체 게시물 수 */
    const cnt = await Product.findOne({ p_No }, { _id: 0, p_Review: 1 }).exec();

    /** 게시물 */
    let reviews = await Review.find(
      { p_No },
      { _id: 0, __v: 0, p_No: 0, u_Idx: 0 },
    )
      .limit(maxpost)
      .skip(skipCnt);

    let result = {
      p_review: cnt.p_Review,
      reviews: reviews,
    };

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 구매평 수정 */
router.put('/:r_No', auth, async (req, res) => {
  try {
    const { r_No } = req.params;
    const { r_Content, r_Score } = req.body;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** token과 r_No의 u_Idx 일치하는지 확인 */
    let db = await Review.findOne({ r_No, u_Idx }).exec();
    if (db != null) {
      await Review.updateOne({ r_No, u_Idx }, { $set: { r_Content, r_Score } });
      res.status(201).json({
        success: true,
      });
      return;
    } else {
      res.status(401).json({
        success: false,
        errorMessage: '권한 없음',
      });
      return;
    }
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 구매평 삭제 */
router.delete('/:r_No', auth, async (req, res) => {
  try {
    const { r_No } = req.params;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** r_No와 u_Idx가 일치하는지 확인 */
    let db = await Review.findOne({ r_No, u_Idx }).exec();
    let reviewCnt = 0;

    if (db != null) {
      let prod = await Product.findOne({ p_No: db.p_No }).exec();
      reviewCnt = prod.p_Review - 1;
      await Product.updateOne(
        { p_No: db.p_No },
        { $set: { p_Review: reviewCnt } },
      );
    } else {
      res.status(401).json({
        success: false,
        errorMessage: '권한 없음',
      });
      return;
    }
    await Review.deleteOne({ r_No });
    res.status(200).json({
      success: true,
      message: 'delete success',
    });
    return;
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
