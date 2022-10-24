const express = require('express');
const router = express.Router();
const Order = require('../schemas/orders');
const CancelProd = require('../schemas/cancelProd');
const auth = require('../middlewares/user-middleware');
const AdminOrder = require('../schemas/adminOrders');

//-- 주문조회
router.get('/', auth, async (req, res) => {
  try {
    const { page, maxpost } = req.query;
    // maxpost 수만큼 page 처리
    Number(page, maxpost);

    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    // token
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    // 전체 주문 수
    let cnt = await Order.find({ u_Idx }).count();

    let orders = await Order.find(
      { u_Idx },
      {
        _id: 0,
        address: 0,
        u_Idx: 0,
        __v: 0,
        o_BankBook: 0,
        o_Receipt: 0,
        o_ReceiptNo: 0,
      },
    )
      .limit(maxpost)
      .skip(skipCnt);

    let orderList = [];
    let list = {};
    let date = 0;

    for (let x in orders) {
      for (let y in orders[x].products) {
        delete orders[x].products[y].k_No;
      }
      date = orders[x].createdAt
        .toISOString()
        .replace('T', ' ')
        .substring(0, 10);

      list = {
        o_No: orders[x].o_No,
        o_Date: date,
        o_Price: orders[x].o_Price,
        products: orders[x].products,
      };
      orderList.push(list);
    }

    return res.status(200).send({
      cnt,
      orderList,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 주문조회 상세정보
router.get('/:o_No', auth, async (req, res) => {
  try {
    let { o_No } = req.params;

    o_No = Number(o_No);
    // token
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    let db = await Order.findOne(
      { o_No, u_Idx },
      { _id: 0, o_BankBook: 0, o_Receipt: 0, o_ReceiptNo: 0, __v: 0 },
    ).exec();

    delete db.address.d_No;

    for (let x in db.products) {
      delete db.products[x].k_No;
    }

    let date = db.createdAt.toISOString().replace('T', ' ').substring(0, 10);

    let result = {
      o_No: db.o_No,
      o_Date: date,
      o_Price: db.o_Price,
      products: db.products,
      userInfo: {
        u_Name: user.u_Name,
        u_Phone: user.u_Phone,
      },
      address: db.address,
    };

    return res.status(200).send(result);
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      message: '잘못된 요청입니다.',
    });
  }
});

//-- 주문취소
router.put('/:o_No/cancel', auth, async (req, res) => {
  try {
    let { o_No } = req.params;
    let { p_No } = req.body;

    o_No = Number(o_No);

    // token
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    for (let a in p_No) {
      await Order.updateOne(
        { o_No, 'products.p_No': p_No[a] },
        {
          $set: { 'products.$.o_Status': '취소완료' },
        },
      );

      await AdminOrder.updateOne(
        { o_No, p_No: p_No[a] },
        {
          $set: { 'products.o_Status': '주문취소', o_Status: '주문취소' },
        },
      );
    }

    // 취소 상품 리스트 생성
    let cancelData = await CancelProd.findOne({ u_Idx, o_No }).exec();
    // cancelProd에 해당 o_No로 디비 있나 확인 후 있으면 삭제
    if (cancelData != null) {
      await CancelProd.deleteOne({ u_Idx, o_No });
    }

    let orderData = await Order.findOne({
      u_Idx,
      o_No,
    }).exec();

    let arrProd = [];
    for (let b in orderData.products) {
      if (orderData.products[b].o_Status == '취소완료') {
        arrProd.push(orderData.products[b]);
      } else {
        continue;
      }
    }

    let result = {
      o_No: o_No,
      u_Idx: u_Idx,
      products: arrProd,
      o_Price: orderData.o_Price,
      createdAt: orderData.createdAt,
    };

    await CancelProd.create(result);

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
