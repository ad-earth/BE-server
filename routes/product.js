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

      /** 키워드 광고 상태 */
      const k_Status = 'off';

      await Keyword.create({
        k_No,
        p_No,
        keyword,
        k_Status,
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

/** 키워드 삭제 */
router.delete('/:p_No/keywords/:keyword', auth, async (req, res) => {
  try {
    const { p_No, keyword } = req.params;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    const db = await Product.findOne({ p_No }, { _id: 0, a_Idx: 1 }).exec();
    const dbIdx = db.a_Idx;

    if (dbIdx === a_Idx) {
      await Keyword.deleteOne({ p_No, keyword });
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

/** 예상 순위 */
router.get(
  '/:p_No/keywords/:keyword/level/:k_Level',
  auth,
  async (req, res) => {
    try {
      // 상품번호, 키워드, 예상 순위 param으로 받음
      let { p_No, keyword, k_Level } = req.params;

      let k_Status = 'on';
      // db.keyword에서 광고중인 키워드있는지 확인
      let findKeyword = await Keyword.find(
        {
          keyword,
          k_Status,
        },
        { _id: 0, k_Level: 1, k_Cost: 1 },
      ).exec();

      let k_Cost = 0;
      // 광고중인 키워드가 없다면 1위 90원 반환
      if (findKeyword.length === 0) {
        k_Cost = 90;
        res.status(200).json({
          k_Cost,
        });
        return;
      }
      // 광고중인 다른 키워드가 있다면 순위 가져옴
      // 그 순위로 광고중인 키워드가 있나 확인
      let level = await Keyword.findOne(
        {
          keyword,
          k_Status,
          k_Level: k_Level,
        },
        { _id: 0, k_Level: 1, k_Cost: 1 },
      ).exec();

      // 있다면 입찰가 +10 반환
      if (level != null) {
        k_Cost = level.k_Cost + 10;
        res.status(200).json({
          k_Cost,
        });
        return;
      }

      // level이 1이면 한 순위 낮은 광고 확인
      if (k_Level == 1) {
        level = await Keyword.findOne(
          {
            keyword,
            k_Status,
          },
          { _id: 0, k_Level: 1, k_Cost: 1 },
        )
          .sort('k_Level')
          .exec();
        k_Cost = level.k_Cost + 10;
        res.status(200).json({
          k_Cost,
        });
        return;
      }

      // level이 4이면
      if (k_Level == 4) {
        level = await Keyword.findOne(
          {
            keyword,
            k_Status,
          },
          { _id: 0, k_Level: 1, k_Cost: 1 },
        )
          .sort('k_Level')
          .exec();
        k_Cost = 90;
        res.status(200).json({
          k_Cost,
        });
        return;
      }

      // 없으면 한 순위 높은 광고 있나 확인(대신 원하는 순위가 1위일때는 2위 키워드)
      k_Level = Number(k_Level) - 1;

      level = await Keyword.findOne(
        {
          keyword,
          k_Status,
          k_Level: k_Level,
        },
        { _id: 0, k_Level: 1, k_Cost: 1 },
      ).exec();

      if (level != null) {
        k_Cost = level.k_Cost - 10;
        res.status(200).json({
          k_Cost,
        });
        return;
      }
    } catch (error) {
      res.status(400).json({
        success: false,
      });
    }
  },
);

/** 광고 등록 */
router.put('/:p_No/keywords', auth, async (req, res) => {
  try {
    const { p_No } = req.params;
    let { add } = req.body;

    let result = 0;
    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    const db = await Admin.findOne({ a_Idx }, { _id: 0, a_Charge: 1 }).exec();

    /** 충전금 부족 및 입찰금 부족 반환 처리 */
    for (let a = 0; a < add.length; a++) {
      // 입찰금이 충전금 보다 가격이 낮거나 같으면 errorMessage 반환
      if (db.a_Charge <= add[a].k_Cost) {
        res.status(400).json({
          errorMessage: '충전금이 부족합니다',
        });
        return;
      }

      result = await Keyword.find(
        { keyword: add[a].keyword, k_Status: 'on', k_Level: add[a].k_Level },
        { _id: 0, k_Level: 1, k_Cost: 1, k_No: 1, p_No: 1 },
      ).exec();
      console.log('result1: ', result);

      // 입찰금이 기존 입찰금보다 가격이 낮거나 같으면 errorMessage 반환
      for (let b = 0; b < result.length; b++) {
        if (
          result[b].k_Cost >= add[a].k_Cost &&
          result[b].p_No == add[a].p_No
        ) {
          res.status(400).json({
            errorMessage: '순위에 맞는 입찰금이 아닙니다.',
          });
          return;
        }
      }
    }

    for (let i = 0; i < add.length; i++) {
      // 해당 순위가 현재 비어있는 순위인지 확인
      result = await Keyword.find(
        {
          keyword: add[i].keyword,
          k_Status: 'on',
          k_Level: add[i].k_Level,
        },
        { _id: 0, k_Level: 1, k_Cost: 1, k_No: 1 },
      ).exec();
      console.log('result2: ', result);

      if (result.length === 0) {
        // 비어있는 순위면 해당 순위에 그 입찰금으로 광고 등록 후 k_Status on으로 변경
        await Keyword.updateOne(
          { p_No, keyword: add[i].keyword },
          {
            $set: {
              k_Level: add[i].k_Level,
              k_Cost: add[i].k_Cost,
              k_Status: 'on',
            },
          },
        );
      } else {
        let result3 = await Keyword.find(
          {
            p_No: { $ne: p_No },
            keyword: add[i].keyword,
            k_Status: 'on',
          },
          { _id: 0, k_Level: 1, k_Cost: 1, k_No: 1 },
        ).exec();
        console.log('result3: ', result3);
        for (let j = 0; j < result3.length; j++) {
          // 입찰금이 기존 입찰금보다 가격이 높으면 k_Level과 같거나 작은 순위는 +1해서 순위를 낮춤
          if (result3[j].k_Level >= add[i].k_Level) {
            let changeLevel = result3[j].k_Level + 1;
            let changeStatus = 'on';
            // 해당 키워드로 5위가 된 광고는 k_Status를 off로 변경
            changeLevel === 5 ? (changeStatus = 'off') : (changeStatus = 'on');
            await Keyword.updateOne(
              { k_No: result3[j].k_No },
              {
                $set: {
                  k_Level: changeLevel,
                  k_Status: changeStatus,
                },
              },
            );
          }
        }
        // 해당 순위와 입찰금으로 광고 등록하며 k_Status는 on으로 변경
        await Keyword.updateOne(
          { p_No, keyword: add[i].keyword },
          {
            $set: {
              k_Level: add[i].k_Level,
              k_Cost: add[i].k_Cost,
              k_Status: 'on',
            },
          },
        );
      }
    }
    res.status(201).json({
      success: true,
    });
    return;
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
