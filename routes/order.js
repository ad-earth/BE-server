const express = require('express');
const router = express.Router();
const Order = require('../schemas/orders');
const CancelProd = require('../schemas/cancelProd');
const auth = require('../middlewares/user-middleware');

/** 주문조회 */
router.get('/', auth, async (req, res) => {
  try {
    const { page, maxpost } = req.query;
    /** maxpost 수만큼 page 처리 */
    Number(page, maxpost);
    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** 전체 주문 수 */
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
      orders[x].createdAt = date;
      list = {
        o_No: orders[x].o_No,
        o_Date: orders[x].createdAt,
        o_Price: orders[x].o_Price,
        products: orders[x].products,
      };
      orderList.push(list);
    }

    res.status(200).json({
      cnt,
      orderList,
    });
  } catch (error) {
    res.status(400).json({
      success: 'false',
    });
  }
});

/** 주문조회 상세정보 */
router.get('/:o_No', auth, async (req, res) => {
  try {
    const { o_No } = req.params;

    /** token */
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

    let date = db.createdAt.substring(0, 10);

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

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

/** 주문취소 */
router.put('/:o_No/cancel', auth, async (req, res) => {
  try {
    let { o_No } = req.params;
    let { p_No } = req.body;
    Number(p_No);

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** o_No의 p_No의 o_Status 찾기 */
    let db = await Order.findOne({ u_Idx, o_No }).exec();

    /** 주문완료일시 취소완료 변경 */
    /** 취소 요청처리해야함 */
    /** 배송완료면 취소완료 변경 안됨 */
    let result = {};
    let arrProd = [];
    if (p_No.length > 1) {
      for (let x = 0; x < db.products.length; x++) {
        for (let z in p_No) {
          if (db.products[x].p_No === p_No[z]) {
            db.products[x].o_Status = '취소완료';
            arrProd.push(db.products[x]);
          }
        }
      }
      result = {
        o_No: db.o_No,
        createdAt: db.createdAt,
        u_Idx: db.u_Idx,
        o_Price: db.o_Price,
        products: arrProd,
      };
    } else {
      for (let y in db.products) {
        if (db.products[y].p_No === p_No[0]) {
          db.products[y].o_Status = '취소완료';
          result = {
            o_No: db.o_No,
            createdAt: db.createdAt,
            u_Idx: db.u_Idx,
            o_Price: db.o_Price,
            products: db.products[y],
          };
        }
      }
    }

    let cancelDb = await CancelProd.findOne({ u_Idx, o_No }).exec();
    if (cancelDb == null) {
      await CancelProd.create({
        o_No: result.o_No,
        createdAt: result.createdAt,
        u_Idx: result.u_Idx,
        o_Price: result.o_Price,
        products: result.products,
      });
    } else {
      for (let a in result.products) {
        cancelDb.products.push(result.products[a]);
      }

      console.log(cancelDb);
      await CancelProd.updateOne(
        { u_Idx, o_No },
        {
          $set: {
            products: cancelDb.products,
          },
        },
      );
    }

    await Order.updateOne(
      { u_Idx, o_No },
      {
        $set: {
          products: db.products,
        },
      },
    );

    res.status(201).json({
      success: true,
    });
    return;
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
