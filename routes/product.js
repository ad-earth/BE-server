const express = require('express');
const router = express.Router();
const Admin = require('../schemas/admins');
const Product = require('../schemas/products');
const Keyword = require('../schemas/keywords');
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

/** 상품삭제 */
router.delete('/', auth, async (req, res) => {
  try {
    const { p_No } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne(
      { p_No: p_No[0] },
      { _id: 0, a_Idx: 1 },
    ).exec();

    if (a_Idx == db.a_Idx) {
      for (let i = 0; i < p_No.length; i++) {
        await Product.deleteOne({ p_No: p_No[i] });
      }
      res.status(200).json({
        success: true,
        message: 'delete success',
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

/** 상품 노출 여부 */
router.put('/status/:p_No', auth, async (req, res) => {
  try {
    const { p_No } = req.params;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne(
      { p_No },
      { _id: 0, a_Idx: 1, p_Status: 1 },
    ).exec();

    if (a_Idx == db.a_Idx) {
      if (db.p_Status == true) {
        await Product.updateOne(
          { p_No },
          {
            $set: {
              p_Status: false,
            },
          },
        );
        res.status(201).json({
          success: true,
        });
        return;
      } else {
        await Product.updateOne(
          { p_No },
          {
            $set: {
              p_Status: true,
            },
          },
        );
        res.status(201).json({
          success: true,
        });
        return;
      }
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

/** 상품 목록 드롭 */
router.get('/list', auth, async (req, res) => {
  try {
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;
    const productList = await Product.find(
      { a_Idx },
      { _id: 0, p_No: 1, p_Name: 1 },
    ).exec();
    if (productList.length != 0) {
      res.status(200).json({
        productList,
      });
      return;
    } else {
      res.status(204).json({
        message: '상품을 등록해주세요',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 드롭 상품 선택 */
/** 테스트 예정 */
router.get('/:p_No/keywords', auth, async (req, res) => {
  try {
    const { p_No } = req.params;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let before = await Keyword.find(
      { p_No, a_Idx },
      { _id: 0, keyword: 1 },
    ).exec();

    res.status(200).json({
      before,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 키워드 추가 */
router.post('/:p_No/keywords', auth, async (req, res) => {
  try {
    const { p_No } = req.params;
    const { keyword } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** 기존에 등록된 키워드가 있는지 */
    let db = await Keyword.find({ keyword, p_No }).exec();

    /** 등록된 키워드가 20개이면 등록 불가 */
    let cnt = await Keyword.find({ p_No }).count();
    if (cnt >= 20) {
      res.status(400).json({
        success: false,
        errorMessage: '키워드 등록 불가',
      });
      return;
    }

    /** 현재 키워드로 등록된 키워드가 없다면 */
    if (db.length == 0) {
      const recentNo = await Keyword.find().sort('-k_No').limit(1);
      let k_No = 1;
      if (recentNo.length !== 0) {
        k_No = recentNo[0]['k_No'] + 1;
      }

      /** 날짜 생성 */
      const createdAt = new Date(+new Date() + 3240 * 10000)
        .toISOString()
        .replace('T', ' ')
        .replace(/\..*/, '');

      await Keyword.create({
        k_No,
        p_No,
        keyword,
        createdAt,
      });

      res.status(201).json({
        success: true,
        message: 'post success',
      });
      return;
    } else {
      res.status(400).json({
        success: false,
        errorMessage: '이미 등록된 키워드입니다.',
      });
      return;
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      errorMessage: '키워드 등록 실패',
    });
  }
});

module.exports = router;
