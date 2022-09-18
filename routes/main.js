const express = require('express');
const router = express.Router();
const Product = require('../schemas/products');
const Wish = require('../schemas/wishes');
const User = require('../schemas/users');
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
      bestProd[a].p_Thumbnail = bestProd[a].p_Thumbnail.slice(0, 1);
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
      newProd[b].p_Thumbnail = newProd[b].p_Thumbnail.slice(0, 1);
    }

    res.status(200).json({
      Best: bestProd,
      New: newProd,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 전체 조회 */
router.get('/products', async (req, res) => {
  try {
    let { sort, page, maxpost } = req.query;

    /** maxpost 수만큼 page 처리 */
    page = Number(page, maxpost);
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    if (sort == 'like') {
      sort = '-p_Like';
    } else if (sort == 'recent') {
      sort = '-p_No'; // 일단 내림차순이지만 최종에는 올림으로 변경
    } else if (sort == 'minprice') {
      sort = 'p_Cost';
    } else {
      sort = '-p_Cost';
    }

    /** db 총 갯수 */
    const cnt = await Product.find({}).count();

    /** 게시물 */
    let products = await Product.find(
      {},
      {
        _id: 0,
        p_No: 1,
        p_Thumbnail: 1,
        p_Category: 1,
        a_Brand: 1,
        p_Name: 1,
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

    res.status(200).json({
      cnt,
      userLike,
      products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
