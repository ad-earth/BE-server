const express = require('express');
const router = express.Router();
const Product = require('../schemas/products');
const Keyword = require('../schemas/keywords');
const Wish = require('../schemas/wishes');
const auth = require('../middlewares/admin-middleware');

//-- 상품등록
router.post('/', auth, async (req, res) => {
  try {
    let {
      p_Category,
      p_Thumbnail,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
      p_Content,
    } = req.body;

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;
    const a_Brand = admin.a_Brand;

    let p_No = new Date().valueOf();

    // 현재 날짜 생성
    const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

    // 옵션 객체 배열로 변환
    let arrOption = [];
    let arrDetail = [];

    for (let i in p_Option) {
      arrDetail = [
        p_Option[i].color,
        p_Option[i].colorCode,
        p_Option[i].option,
        p_Option[i].optionPrice,
        p_Option[i].optionCnt,
      ];
      arrOption.push(arrDetail);
    }

    p_Option = arrOption;

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
      p_Content,
      createdAt,
    });

    return res.status(201).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 전체 및 카테고리 상품 조회
router.get('/', auth, async (req, res) => {
  try {
    let { page, maxpost, p_Category } = req.query;

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let findData = {};
    if (p_Category.length != 0 && p_Category != '전체') {
      // 카테고리별 상품
      findData = { a_Idx, p_Category };
    } else {
      // 전체 상품
      findData = { a_Idx };
    }

    // 총 상품 수
    let cnt = await Product.find(findData).count();

    let list = [];

    if (cnt == 0) {
      list = [];
    } else {
      // page처리
      page = Number(page);
      maxpost = Number(maxpost);

      let skipCnt = 0;
      page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

      let data = await Product.find(findData, {
        _id: 0,
        p_No: 1,
        p_Category: 1,
        p_Name: 1,
        p_Status: 1,
      })
        .sort()
        .limit(maxpost)
        .skip(skipCnt);

      let objData = {};
      for (let a in data) {
        objData = {
          id: skipCnt + 1 + Number(a),
          p_No: data[a].p_No,
          p_Category: data[a].p_Category,
          p_Name: data[a].p_Name,
          p_Status: data[a].p_Status,
        };
        list.push(objData);
      }
    }

    return res.status(200).send({
      cnt,
      list,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 상품 목록 드롭
router.get('/list', auth, async (req, res) => {
  try {
    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let productList = await Product.find(
      { a_Idx },
      { _id: 0, p_No: 1, p_Name: 1 },
    ).exec();

    return res.status(200).send({
      productList,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 상품 노출 여부
router.put('/status/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;

    p_No = Number(p_No);

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne(
      { p_No },
      { _id: 0, a_Idx: 1, p_Status: 1 },
    ).exec();

    let status = true;

    if (a_Idx == db.a_Idx) {
      if (db.p_Status == true) {
        status = false;
      } else {
        status = true;
      }
      await Product.updateOne(
        { p_No },
        {
          $set: {
            p_Status: status,
          },
        },
      );
      return res.status(201).send({
        success: true,
      });
    } else {
      return res.status(401).send({
        errorMessage: '권한 없음',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 상품 상세 정보
router.get('/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;

    p_No = Number(p_No);

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let prodInfo = await Product.findOne(
      { a_Idx, p_No },
      {
        _id: 0,
        p_Category: 1,
        p_Thumbnail: 1,
        p_Name: 1,
        p_Cost: 1,
        p_Sale: 1,
        p_Discount: 1,
        p_Option: 1,
        p_Desc: 1,
        p_Content: 1,
      },
    ).exec();

    let arrOption = [];
    let objOption = {};
    for (let i in prodInfo.p_Option) {
      objOption = {
        color: prodInfo.p_Option[i][0],
        colorCode: prodInfo.p_Option[i][1],
        option: prodInfo.p_Option[i][2],
        optionPrice: prodInfo.p_Option[i][3],
        optionCnt: prodInfo.p_Option[i][4],
      };
      arrOption.push(objOption);
    }

    prodInfo.p_Option = arrOption;

    return res.status(200).send(prodInfo);
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 상품수정
router.put('/:p_No', auth, async (req, res) => {
  try {
    let { p_No } = req.params;
    let {
      p_Category,
      p_Thumbnail,
      p_Name,
      p_Cost,
      p_Sale,
      p_Discount,
      p_Option,
      p_Desc,
      p_Content,
    } = req.body;

    p_No = Number(p_No);

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    // 옵션 객체 배열 변경
    let arrDetail = [];
    let arrOption = [];

    for (let i in p_Option) {
      arrDetail = [
        p_Option[i].color,
        p_Option[i].colorCode,
        p_Option[i].option,
        p_Option[i].optionPrice,
        p_Option[i].optionCnt,
      ];
      arrOption.push(arrDetail);
    }

    p_Option = arrOption;

    let db = await Product.findOne({ p_No }, { _id: 0, a_Idx: 1 }).exec();

    // token과 param의 a_Idx 일치하는지 확인
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
            p_Content,
          },
        },
      );
      return res.status(201).send({
        success: true,
      });
    } else {
      return res.status(401).send({
        errorMessage: '권한 없음',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 상품삭제
router.delete('/', auth, async (req, res) => {
  try {
    let { p_No } = req.body;

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    let db = await Product.findOne(
      { p_No: p_No[0] },
      { _id: 0, a_Idx: 1 },
    ).exec();

    if (a_Idx == db.a_Idx) {
      for (let i in p_No) {
        // 등록 상품 삭제
        await Product.deleteOne({ p_No: p_No[i] });
        // 등록 키워드 삭제
        await Keyword.deleteOne({ p_No: p_No[i], a_Idx });
        // 위시리스트 삭제
        await Wish.deleteMany({ p_No });
      }

      return res.status(200).send({
        success: true,
      });
    } else {
      return res.status(401).send({
        errorMessage: '권한 없음',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 상품 상세 설명 수정
router.put('/content/:p_No', async (req, res) => {
  try {
    let { p_No } = req.params;
    let { p_Content } = req.body;

    p_No = Number(p_No);

    let result = await Product.updateOne({ p_No }, { $set: { p_Content } });
    console.log('result: ', result);

    res.status(201).send({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

module.exports = router;
