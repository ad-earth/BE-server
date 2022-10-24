const express = require('express');
const router = express.Router();
const AdminOrder = require('../schemas/adminOrders');
const SalesProduct = require('../schemas/salesProducts');
const SalesKeyword = require('../schemas/salesKeywords');
const Order = require('../schemas/orders');
const Product = require('../schemas/products');
const Keyword = require('../schemas/keywords');
const auth = require('../middlewares/admin-middleware');

//-- 배송 조회
router.get('/', auth, async (req, res) => {
  try {
    let { page, maxpost, date, p_Name, o_Status } = req.query;

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    // page 처리
    page = Number(page);
    maxpost = Number(maxpost);

    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    let cnt = 0;
    let arrProd = [];

    // 기간 조회 type 선언
    let start = '';
    let endDate = Date;
    let end = '';
    // find 조건 type 선언
    let objFind = {};

    if (p_Name == 'null' && o_Status == 'null' && date != 'null') {
      // 기간 조회
      start = new Date(date.substring(1, 11));
      endDate = new Date(date.substring(12, 22));
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        a_Idx: a_Idx,
      };
    } else if (p_Name != 'null' && o_Status == 'null' && date == 'null') {
      // 상품명 조회
      objFind = {
        'products.p_Name': p_Name,
        a_Idx: a_Idx,
      };
    } else if (p_Name == 'null' && o_Status != 'null' && date == 'null') {
      // 주문상태 조회
      objFind = {
        o_Status: o_Status,
        a_Idx: a_Idx,
      };
    } else if (p_Name != 'null' && o_Status == 'null' && date != 'null') {
      // 기간, 상품명 조회
      start = new Date(date.substring(1, 11));
      endDate = new Date(date.substring(12, 22));
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        'products.p_Name': p_Name,
        a_Idx: a_Idx,
      };
    } else if (p_Name == 'null' && o_Status != 'null' && date != 'null') {
      // 기간, 주문상태 조회
      start = new Date(date.substring(1, 11));
      endDate = new Date(date.substring(12, 22));
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        o_Status: o_Status,
        a_Idx: a_Idx,
      };
    } else if (p_Name != 'null' && o_Status != 'null' && date == 'null') {
      // 상품명, 주문상태 조회
      objFind = {
        o_Status: o_Status,
        'products.p_Name': p_Name,
        a_Idx: a_Idx,
      };
    } else if (p_Name != 'null' && o_Status != 'null' && date != 'null') {
      // 기간, 상품명, 주문상태 조회
      start = new Date(date.substring(1, 11));
      endDate = new Date(date.substring(12, 22));
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        'products.p_Name': p_Name,
        o_Status: o_Status,
        a_Idx: a_Idx,
      };
    } else {
      // 전체 조회(첫 화면)
      objFind = {
        a_Idx: a_Idx,
      };
    }

    cnt = await AdminOrder.find(objFind).count();

    arrProd = await AdminOrder.find(objFind)
      .sort('o_Date')
      .limit(maxpost)
      .skip(skipCnt);

    let list = [];
    let objProd = {};

    for (let c in arrProd) {
      let objDate = arrProd[c].o_Date;
      objDate = objDate.toISOString().replace('T', ' ').substring(0, 10);

      objProd = {
        id: skipCnt + 1 + Number(c),
        o_No: arrProd[c].o_No,
        p_No: arrProd[c].p_No,
        p_Name: arrProd[c].products.p_Name,
        p_Option: arrProd[c].products.p_Option,
        p_Cnt: arrProd[c].products.p_Cnt,
        p_Price: arrProd[c].products.p_Price,
        u_Id: arrProd[c].u_Id,
        d_Name: arrProd[c].address.d_Name,
        d_Address1: arrProd[c].address.d_Address1,
        d_Address2: arrProd[c].address.d_Address2,
        d_Address3: arrProd[c].address.d_Address3,
        d_Phone: arrProd[c].address.d_Phone,
        d_Memo: arrProd[c].address.d_Memo,
        o_Date: objDate,
        o_Status: arrProd[c].o_Status,
      };

      list.push(objProd);
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

//-- 신규주문에 대하여 주문확정 처리
router.put('/', auth, async (req, res) => {
  try {
    let { confirm } = req.body;

    // token
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    // 신규주문인지 확인
    for (let a in confirm) {
      let trueStatus = await AdminOrder.findOne({
        o_No: confirm[a].o_No,
        p_No: confirm[a].p_No,
      }).exec();

      if (
        trueStatus.o_Status == '주문취소' ||
        trueStatus.o_Status == '배송완료'
      ) {
        return res.status(400).json({
          errorMessage: `해당 주문번호(${trueStatus.o_No})의 상품번호(${trueStatus.p_No})는 신규 상품이 아닙니다.`,
        });
      }
    }

    let r_Status = true;

    // 신규주문 상태 배송완료로 변경
    for (let b in confirm) {
      await AdminOrder.updateOne(
        { o_No: confirm[b].o_No, p_No: confirm[b].p_No, a_Idx: a_Idx },
        {
          $set: {
            'products.r_Status': r_Status,
            'products.o_Status': '배송완료',
            o_Status: '배송완료',
          },
        },
      );
    }

    let orderStatus = '배송완료';

    // 주문완료 상태 배송완료 변경
    for (let c in confirm) {
      await Order.updateOne(
        {
          o_No: confirm[c].o_No,
          'products.p_No': confirm[c].p_No,
        },
        {
          $set: {
            'products.$.o_Status': orderStatus,
            'products.$.r_Status': r_Status,
          },
        },
      );
    }

    // 오늘 날짜 생성
    const createdAt = new Date(+new Date() + 3240 * 10000).toISOString();

    // salesReport 구매내역 생성
    for (let d in confirm) {
      let prodInfo = await AdminOrder.findOne({
        o_No: confirm[d].o_No,
        p_No: confirm[d].p_No,
      }).exec();

      await SalesProduct.create({
        a_Idx: prodInfo.a_Idx,
        p_No: prodInfo.p_No,
        p_Category: prodInfo.products.p_Category,
        p_Name: prodInfo.products.p_Name,
        p_Cnt: prodInfo.products.p_Cnt,
        p_Price: prodInfo.products.p_Price,
        createdAt: createdAt,
      });

      let infoProd = await Product.findOne(
        { p_No: confirm[d].p_No },
        { _id: 0, p_Price: 1, p_Cnt: 1 },
      );

      // 상품 누적 판매 금액 및 수량 업데이트
      let prodPrice = infoProd.p_Price + prodInfo.products.p_Price;
      let prodCnt = infoProd.p_Cnt + prodInfo.products.p_Cnt;

      let prodInfoUpdate = await Product.updateOne(
        { p_No: confirm[d].p_No },
        {
          $set: {
            p_Price: prodPrice,
            p_Cnt: prodCnt,
          },
        },
      );
    }

    // salesKeyword 전환내역 생성
    for (let e in confirm) {
      let findKeywordInfo = await AdminOrder.findOne({
        o_No: confirm[e].o_No,
        p_No: confirm[e].p_No,
      }).exec();

      if (
        findKeywordInfo.products.k_No == null ||
        findKeywordInfo.products.k_No == 0
      ) {
        continue;
      } else {
        let keywordInfo = await Keyword.findOne({
          p_No: findKeywordInfo.p_No,
          k_No: findKeywordInfo.products.k_No,
        }).exec();

        await SalesKeyword.create({
          a_Idx: findKeywordInfo.a_Idx,
          keyword: keywordInfo.keyword,
          p_No: keywordInfo.p_No,
          k_Trans: 1,
          p_Price: findKeywordInfo.products.p_Price,
          createdAt: createdAt,
        });
      }
    }

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

module.exports = router;
