const express = require('express');
const router = express.Router();
const User = require('../schemas/users');
const Delivery = require('../schemas/deliveries');
const Product = require('../schemas/products');
const Order = require('../schemas/orders');
const auth = require('../middlewares/user-middleware');

router.put('/:d_No', auth, async (req, res) => {
  try {
    const { d_No } = req.params;
    const { d_Name, d_Phone, d_Address1, d_Address2 } = req.body;

    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** db.Deliveries에 해당 유저의 배송지 고유번호 있나 확인 */
    let db = await Delivery.find({ u_Idx, d_No });
    if (db.length > 0) {
      await Delivery.updateOne(
        { u_Idx, d_No },
        {
          $set: {
            d_Name,
            d_Phone,
            d_Address1,
            d_Address2,
          },
        },
      );
    } else {
      res.status(404).json({
        errorMessage: '잘못된 요청입니다.',
      });
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
