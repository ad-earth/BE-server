const express = require('express');
const router = express.Router();
const Product = require('../schemas/products');
const Wish = require('../schemas/wishes');
const Keyword = require('../schemas/keywords');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const jwtKey = process.env.U_TOKEN;

/** 메인화면 */
router.get('/', async (req, res) => {
  try {
    /** best */
    let bestProd = await Product.find(
      {},
      {
        _id: 0,
        p_No: 1,
        p_Thumbnail: 1,
        a_Brand: 1,
        p_Name: 1,
        p_Cost: 1,
        p_Sale: 1,
        p_Discount: 1,
        p_Option: 1,
        p_Soldout: 1,
      },
    )
      .sort('-p_Price')
      .limit(6);
    for (let a = 0; a < bestProd.length; a++) {
      bestProd[a].p_Best = true;
      bestProd[a].p_New = false;
      bestProd[a].p_Thumbnail = bestProd[a].p_Thumbnail.slice(0, 2);
    }

    /** new */
    let newProd = await Product.find(
      {},
      {
        _id: 0,
        p_No: 1,
        p_Thumbnail: 1,
        a_Brand: 1,
        p_Name: 1,
        p_Cost: 1,
        p_Sale: 1,
        p_Discount: 1,
        p_Option: 1,
        p_Soldout: 1,
      },
    )
      .sort('-p_No')
      .limit(9);

    for (let b = 0; b < newProd.length; b++) {
      newProd[b].p_Best = false;
      newProd[b].p_New = true;
      newProd[b].p_Thumbnail = newProd[b].p_Thumbnail.slice(0, 2);
    }

    return res.status(200).send({
      Best: bestProd,
      New: newProd,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

/** 검색 상품 조회 */
router.get('/search', async (req, res) => {
  try {
    let { keyword, page, maxpost } = req.query;

    page = Number(page);
    maxpost = Number(maxpost);

    /** maxpost 수만큼 page 처리 */
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    /** 키워드를 등록한 전체 게시물 수 */
    const cnt = await Keyword.find({ keyword: keyword }).count();

    /** 광고 on 상태인 게시물 수 */
    const onCnt = await Keyword.find({
      keyword: keyword,
      k_Status: 'on',
    }).count();

    let adProducts = [];
    let products = [];

    if (page == 1) {
      /** 키워드 광고를 등록한 전체 게시물 순위로 뽑음 */
      let onKeyword = await Keyword.find(
        {
          keyword: keyword,
          k_Status: 'on',
        },
        { _id: 0, p_No: 1, k_Level: 1 },
      )
        .sort('k_Level')
        .exec();
      for (let x = 0; x < onKeyword.length; x++) {
        let arrProd = await Product.find(
          { p_No: onKeyword[x].p_No },
          {
            _id: 0,
            p_No: 1,
            p_Thumbnail: 1,
            a_Brand: 1,
            p_Name: 1,
            p_Desc: 1,
            p_Cost: 1,
            p_Sale: 1,
            p_Discount: 1,
            p_Option: 1,
            p_New: 1,
            p_Best: 1,
            p_Soldout: 1,
            p_Review: 1,
            p_Like: 1,
          },
        ).exec();
        let objProd = arrProd.pop();
        if (objProd != undefined) {
          adProducts.push(objProd);
        }
      }
      maxpost = maxpost - onCnt;
    } else {
      maxpost = 2;
      skipCnt = maxpost - onCnt;
    }
    /** 키워드는 등록했지만 광고 등록하지 않은 게시물 */
    let offKeyword = await Keyword.find(
      {
        keyword: keyword,
        k_Status: 'off',
      },
      { _id: 0, p_No: 1 },
    )
      .limit(maxpost)
      .skip(skipCnt)
      .exec();

    for (let y in offKeyword) {
      let arrProd2 = await Product.find(
        { p_No: offKeyword[y].p_No },
        {
          _id: 0,
          p_No: 1,
          p_Thumbnail: 1,
          a_Brand: 1,
          p_Name: 1,
          p_Desc: 1,
          p_Cost: 1,
          p_Sale: 1,
          p_Discount: 1,
          p_Option: 1,
          p_New: 1,
          p_Best: 1,
          p_Soldout: 1,
          p_Review: 1,
          p_Like: 1,
        },
      )
        .sort('-p_Like')
        .exec();

      let objProd2 = arrProd2.pop();
      if (objProd2 != undefined) {
        products.push(objProd2);
      }
    }

    /** thumbnail 가공 */
    for (let a in adProducts) {
      adProducts[a].p_Thumbnail = adProducts[a].p_Thumbnail.slice(0, 2);
    }
    for (let b in products) {
      products[b].p_Thumbnail = products[b].p_Thumbnail.slice(0, 1);
    }

    /** like 가공 */
    for (let c in adProducts) {
      if (adProducts[c].p_Like > 0) {
        adProducts[c].p_Best = true;
      } else {
        adProducts[c].p_Best = false;
      }
    }

    for (let d in products) {
      if (products[d].p_Like > 0) {
        products[d].p_Best = true;
      } else {
        products[d].p_Best = false;
      }
    }
    /** 게시물에 좋아요를 누른 유저 */
    let userLike = [];
    const { authorization } = req.headers;

    if (!authorization) {
      /** header에 token이 없으면 */
      userLike = [];
    } else {
      /** header에 token이 있으면 */
      const [tokenType, tokenValue] = (authorization || '').split(' ');
      const { u_Idx } = jwt.verify(tokenValue, jwtKey);
      let idx = u_Idx;

      for (let e in adProducts) {
        let wishUser = await Wish.find({
          u_Idx: idx,
          p_No: adProducts[e].p_No,
        });
        let popNo = wishUser.pop();

        if (popNo != undefined) {
          userLike.push(popNo.p_No);
        }
      }

      for (let f in products) {
        let wishUser2 = await Wish.find({
          u_Idx: idx,
          p_No: products[f].p_No,
        });
        let popNo2 = wishUser2.pop();
        if (popNo2 != undefined) {
          userLike.push(popNo2.p_No);
        }
      }
    }

    return res.status(200).send({
      cnt,
      userLike,
      adProducts,
      products,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

/** 카테고리별 조회 */
router.get('/products/:p_Category', async (req, res) => {
  try {
    let { sort, page, maxpost } = req.query;
    let { p_Category } = req.params;
    console.log('p_Category: ', p_Category);

    page = Number(page);
    maxpost = Number(maxpost);

    /** maxpost 수만큼 page 처리 */
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    if (sort == 'like') {
      sort = '-p_Like';
    } else if (sort == 'recent') {
      sort = 'p_No'; // 일단 내림차순이지만 최종에는 올림으로 변경
    } else if (sort == 'minprice') {
      sort = 'p_Cost';
    } else {
      sort = '-p_Cost';
    }

    let objFind = {};
    if (p_Category == '전체') {
      objFind = {};
      console.log('전체 p_Category: ', p_Category);
    } else {
      objFind = { p_Category: p_Category };
      console.log('선택 p_Category: ', p_Category);
    }
    /** 카테고리 전체 게시물 수 */
    let cnt = await Product.find(objFind).count();

    /** 게시물 */
    let products = await Product.find(objFind, {
      _id: 0,
      p_No: 1,
      p_Thumbnail: 1,
      p_Category: 1,
      a_Brand: 1,
      p_Name: 1,
      p_Desc: 1,
      p_Cost: 1,
      p_Sale: 1,
      p_Discount: 1,
      p_Option: 1,
      p_New: 1,
      p_Best: 1,
      p_Soldout: 1,
      p_Review: 1,
      p_Like: 1,
    })
      .sort(sort)
      .limit(maxpost)
      .skip(skipCnt);

    /** best 기준 like가 1개라도 있으면 true 추후 수정 예정 */
    for (let x = 0; x < products.length; x++) {
      if (products[x].p_Like > 0) {
        products[x].p_Best = true;
      } else {
        products[x].p_Best = false;
      }
    }

    /** 게시물에 좋아요를 누른 유저 */
    let userLike = [];
    const { authorization } = req.headers;

    if (!authorization) {
      /** header에 token이 없으면 */
      userLike = [];
    } else {
      /** header에 token이 있으면 */
      const [tokenType, tokenValue] = (authorization || '').split(' ');
      const { u_Idx } = jwt.verify(tokenValue, jwtKey);
      let idx = u_Idx;

      for (let i = 0; i < products.length; i++) {
        let wishUser = await Wish.find({ u_Idx: idx, p_No: products[i].p_No });
        let popNo = wishUser.pop();

        if (popNo != undefined) {
          userLike.push(popNo.p_No);
        }
      }
    }

    return res.status(200).send({
      cnt,
      userLike,
      products,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      success: false,
    });
  }
});

module.exports = router;
