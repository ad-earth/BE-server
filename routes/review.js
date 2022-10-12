const express = require('express');
const router = express.Router();
const Review = require('../schemas/reviews');
const Product = require('../schemas/products');
const auth = require('../middlewares/user-middleware');
const Order = require('../schemas/orders');
const AdminOrder = require('../schemas/adminOrders');

/** 구매평 등록 */
router.post('/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;
    let { r_Score, r_Content } = req.body;

    p_No = Number(p_No);

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;
    const u_Id = user.u_Id;

    /** admin 판매 목록에 구매내역 있는지 확인 */
    let findAdminOrder = await AdminOrder.findOne({
      p_No,
      u_Idx,
      'products.r_Status': true,
    }).exec();

    if (findAdminOrder == null) {
      return res.status(401).send({
        errorMessage: '작성 권한 없음',
      });
    } else {
      /** 댓글 고유 번호 */
      let r_No = new Date().valueOf();

      /** 날짜 생성 */
      const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();
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
      if (reviewsCnt.p_Review < 1) {
        prodReview = 1;
      } else {
        prodReview = reviewsCnt.p_Review + 1;
      }
      await Product.updateOne({ p_No }, { p_Review: prodReview });

      await AdminOrder.updateOne(
        { o_No: findAdminOrder.o_No, p_No },
        { $set: { 'products.r_Status': false } },
      );

      await Order.updateOne(
        { o_No: findAdminOrder.o_No, 'products.p_No': p_No },
        { $set: { 'products.$.r_Status': false } },
      );
    }
    return res.status(201).send({
      success: true,
      message: 'post success',
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
      errorMessage: '댓글 등록 실패',
    });
  }
});

/** 구매평 조회 */
router.get('/:p_No', async (req, res) => {
  try {
    let { p_No } = req.params;
    let { page, maxpost } = req.query;

    p_No = Number(p_No);
    page = Number(page);
    maxpost = Number(maxpost);

    /** maxpost 수만큼 page 처리 */
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    /** 전체 게시물 수 */
    const cnt = await Product.findOne({ p_No }, { _id: 0, p_Review: 1 }).exec();

    /** 게시물 */
    let prodReview = await Review.find(
      { p_No },
      { _id: 0, __v: 0, p_No: 0, u_Idx: 0 },
    )
      .limit(maxpost)
      .skip(skipCnt);

    let arrResult = [];
    for (let a in prodReview) {
      let date = prodReview[a].createdAt
        .toISOString()
        .replace('T', ' ')
        .substring(0, 10);

      let reviews = {
        r_No: prodReview[a].r_No,
        u_Id: prodReview[a].u_Id,
        r_Score: prodReview[a].r_Score,
        r_Content: prodReview[a].r_Content,
        createdAt: date,
      };
      arrResult.push(reviews);
    }

    let result = {
      p_review: cnt.p_Review,
      reviews: arrResult,
    };

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

/** 구매평 수정 */
router.put('/:r_No', auth, async (req, res) => {
  try {
    let { r_No } = req.params;
    const { r_Content, r_Score } = req.body;

    r_No = Number(r_No);

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** token과 r_No의 u_Idx 일치하는지 확인 */
    let db = await Review.findOne({ r_No, u_Idx }).exec();
    if (db != null) {
      await Review.updateOne({ r_No, u_Idx }, { $set: { r_Content, r_Score } });
      return res.status(201).send({
        success: true,
      });
    } else {
      return res.status(401).send({
        success: false,
        errorMessage: '권한 없음',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

/** 구매평 삭제 */
router.delete('/:r_No', auth, async (req, res) => {
  try {
    let { r_No } = req.params;

    r_No = Number(r_No);

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
      return res.status(401).send({
        success: false,
        errorMessage: '권한 없음',
      });
    }
    await Review.deleteOne({ r_No });
    return res.status(200).send({
      success: true,
      message: 'delete success',
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

module.exports = router;
