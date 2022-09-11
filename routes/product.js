const express = require('express');
const router = express.Router();
const Admin = require('../schemas/admins');
const Product = require('../schemas/products');
const auth = require('../middlewares/admin-middleware');
const fnc = require('../functions/noCreate');

/** 상품등록 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      p_Category,
      p_Thumbnail,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
    } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;
    const a_Brand = admin.a_Brand;

    /** 판매자 번호 확인 및 생성 (보류) */
    const recentNo = await Product.find().sort('-p_No').limit(1);
    let p_No = 1; // 상품당 옵션 부가번호
    if (recentNo.length !== 0) {
      p_No = recentNo[0]['p_No'] + 1;
    }

    /** 날짜 생성 */
    const createdAt = new Date(+new Date() + 3240 * 10000)
      .toISOString()
      .replace('T', ' ')
      .replace(/\..*/, '');

    /** soldout */
    let p_Soldout = false;

    /** 상품 노출 */
    let p_Status = true;

    await Product.create({
      p_No,
      a_Idx,
      p_Category,
      p_Thumbnail,
      a_Brand,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
      p_Soldout,
      p_Status,
      createdAt,
    });

    res.status(201).json({
      success: true,
      message: 'post success',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      errorMessage: '상품 등록 실패',
    });
  }
});

/** 상품조회 */
router.get('/', auth, async (req, res) => {
  try {
    let { page, maxpost } = req.query;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** page처리 */
    page = Number(page);
    maxpost = Number(maxpost);

    let cnt = 0;
    page == 1 ? (cnt = 0) : (cnt = page * maxpost - maxpost);
    const list = await Product.find(
      { a_Idx },
      { _id: 0, p_No: 1, p_Category: 1, p_Name: 1, p_Soldout: 1 },
    )
      .sort()
      .limit(maxpost)
      .skip(cnt);

    /** 전체 게시물 수 */
    cnt = await Product.find({ a_Idx }).count();

    res.status(200).json({
      cnt,
      list,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 상품수정 */
router.put('/:p_No', auth, async (req, res) => {
  try {
    const {
      p_Category,
      p_Thumbnail,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
    } = req.body;
    const { p_No } = req.params;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne({ p_No }, { _id: 0, a_Idx: 1 }).exec();

    /** token과 param의 a_Idx 일치하는지 확인 */
    if (a_Idx == db.a_Idx) {
      await Product.updateOne(
        { p_No },
        {
          $set: {
            p_Category,
            p_Thumbnail,
            p_Name,
            p_Cost,
            p_Sale,
            p_Discount,
            p_Option,
            p_Desc,
          },
        },
      );
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

module.exports = router;
