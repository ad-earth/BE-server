const express = require('express');
const router = express.Router();
const AdminOrder = require('../schemas/adminOrders');
const Product = require('../schemas/products');
const Order = require('../schemas/orders');
const auth = require('../middlewares/admin-middleware');

/** 배송조회 */
router.get('/', auth, async (req, res) => {
  try {
    let { page, maxpost } = req.query;
    let { date, p_Name, o_Status } = req.body;

    /** token */
    const { admin } = res.locals;
    const a_Idx = admin.a_Idx;

    /** page처리 */
    page = Number(page);
    maxpost = Number(maxpost);

    let skipCnt = 0;
    page == 1 ? (skipCnt = 0) : (skipCnt = page * maxpost - maxpost);

    let cnt = 0;
    let arrProd = [];

    /** date 처리 */
    let start = '';
    let endDate = Date;
    let end = '';
    let objFind = {};

    if (p_Name == undefined && o_Status == undefined && date != undefined) {
      /** date */
      start = new Date(date[0]);
      endDate = new Date(date[1]);
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        a_Idx: a_Idx,
      };
    } else if (
      p_Name != undefined &&
      o_Status == undefined &&
      date == undefined
    ) {
      /** p_Name */
      objFind = {
        'products.p_Name': p_Name,
        a_Idx: a_Idx,
      };
    } else if (
      p_Name == undefined &&
      o_Status != undefined &&
      date == undefined
    ) {
      /** o_Status */
      objFind = {
        o_Status: o_Status,
        a_Idx: a_Idx,
      };
    } else if (
      p_Name != undefined &&
      o_Status == undefined &&
      date != undefined
    ) {
      /** date, p_Name */
      start = new Date(date[0]);
      endDate = new Date(date[1]);
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        'products.p_Name': p_Name,
        a_Idx: a_Idx,
      };
    } else if (
      p_Name == undefined &&
      o_Status != undefined &&
      date != undefined
    ) {
      /** date, o_Status */
      start = new Date(date[0]);
      endDate = new Date(date[1]);
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        o_Status: o_Status,
        a_Idx: a_Idx,
      };
    } else if (
      p_Name != undefined &&
      o_Status != undefined &&
      date == undefined
    ) {
      /** p_Name, o_Status */
      objFind = {
        o_Status: o_Status,
        'products.p_Name': p_Name,
        a_Idx: a_Idx,
      };
    } else if (
      p_Name != undefined &&
      o_Status != undefined &&
      date != undefined
    ) {
      /** date, p_Name, o_Status */
      start = new Date(date[0]);
      endDate = new Date(date[1]);
      end = new Date(endDate);
      end.setDate(endDate.getDate() + 1);

      objFind = {
        o_Date: { $gte: start, $lte: end },
        'products.p_Name': p_Name,
        o_Status: o_Status,
        a_Idx: a_Idx,
      };
    } else {
      objFind = {
        a_Idx: a_Idx,
      };
    }

    cnt = await AdminOrder.find(objFind).count();

    arrProd = await AdminOrder.find(objFind)
      .sort('o_Date')
      .limit(maxpost)
      .skip(skipCnt);

    let rrr = {
      date: ['2022-09-21', '2022-09-23'],
      p_Name: '칫솔',
      o_Status: '신규주문',
    };

    /** data 가공  */
    let list = [];
    let objProd = {};

    for (let c in arrProd) {
      let objDate = arrProd[c].o_Date;
      objDate = objDate.toISOString().replace('T', ' ').substring(0, 10);

      objProd = {
        o_No: arrProd[c].o_No,
        p_No: arrProd[c].p_No,
        p_Name: arrProd[c].products.p_Name,
        p_Cnt: arrProd[c].products.p_Cnt,
        p_Price: arrProd[c].products.p_Price,
        u_Id: arrProd[c].u_Id,
        d_Name: arrProd[c].address.d_Name,
        d_Address1: arrProd[c].address.d_Address1,
        d_Address2: arrProd[c].address.d_Address2,
        d_Phone: arrProd[c].address.d_Phone,
        d_Memo: arrProd[c].address.d_Memo,
        o_Date: objDate,
        o_Status: arrProd[c].o_Status,
      };
      list.push(objProd);
    }

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
module.exports = router;
