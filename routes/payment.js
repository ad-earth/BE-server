const express = require('express');
const router = express.Router();
const User = require('../schemas/users');
const Product = require('../schemas/products');
const Cart = require('../schemas/carts');
const Delivery = require('../schemas/deliveries');
const auth = require('../middlewares/user-middleware');

/** 결제페이지 첫화면 */
router.get('/', auth, async (req, res) => {
  try {
    /** token */
    const { user } = res.locals;
    const u_Idx = user.u_Idx;

    /** userInfo */
    const userInfo = await User.findOne(
      { u_Idx },
      { _id: 0, u_Name: 1, u_Phone: 1, u_Address1: 1, u_Address2: 1 },
    ).exec();

    /** addressList */
    const addressList = await Delivery.find(
      { u_Idx },
      { _id: 0, __v: 0 },
    ).exec();

    res.status(200).json({
      userInfo,
      addressList,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
    });
  }
});

module.exports = router;
