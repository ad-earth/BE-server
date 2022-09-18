const express = require('express');
const router = express.Router();
const User = require('../schemas/users');
const Admin = require('../schemas/admins');
const Product = require('../schemas/products');
const Keyword = require('../schemas/keywords');
// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');

// dotenv.config();
// const jwtKey = process.env.U_TOKEN;

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

module.exports = router;
