const Cart = require('../schemas/carts');
const Product = require('../schemas/products');

const cart = {
  updateCart: async (req, res) => {
    try {
      const { c_Type } = req.params;
      const { k_No, p_No, p_Option } = req.body;

      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      let findObj = {};
      let setObj = {};
      let createObj = { u_Idx, c_Type, p_No, p_Option, k_No };

      if (c_Type === 'd') {
        findObj = { u_Idx, c_Type };
        setObj = { p_No: p_No, p_Option: p_Option, k_No: k_No };
      } else {
        findObj = { u_Idx, c_Type, p_No };
        setObj = { p_Option: p_Option, k_No: k_No };
      }

      const findCartProd = await Cart.find(findObj, { _id: 0 });

      if (findCartProd.length === 0) {
        await Cart.create(createObj);
      } else {
        await Cart.updateOne(findObj, { $set: setObj });
      }

      const cartStatus = await Cart.find({ u_Idx, c_Type: 'c' }).count();

      return res.status(200).send({
        cartStatus,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        success: false,
      });
    }
  },
  getCart: async (req, res) => {
    try {
      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      const cartType = 'c';

      let findCartData = await Cart.find(
        { u_Idx, c_Type: cartType },
        { _id: 0, k_No: 1, p_No: 1, p_Option: 1 },
      ).exec();

      let cartList = [];
      let cartObj = {};
      let o_Price = 0;

      if (findCartData.length === 0) {
        cartList = [];
        o_Price = 0;
      } else {
        for (let a in findCartData) {
          let cartProdNo = findCartData[a].p_No;

          let findProdData = await Product.findOne(
            { p_No: cartProdNo },
            {
              _id: 0,
              a_Brand: 1,
              p_No: 1,
              p_Category: 1,
              p_Sale: 1,
              p_Discount: 1,
              p_Name: 1,
              p_Cost: 1,
              p_Thumbnail: 1,
            },
          );

          let p_Cnt = 0;
          let p_Price = 0;

          for (let b in findCartData[a].p_Option) {
            p_Cnt = p_Cnt + findCartData[a].p_Option[b][4];
            p_Price = p_Price + findCartData[a].p_Option[b][5];
          }

          cartObj = {
            k_No: findCartData[a].k_No,
            p_No: findCartData[a].p_No,
            a_Brand: findProdData.a_Brand,
            p_Thumbnail: findProdData.p_Thumbnail,
            p_Category: findProdData.p_Category,
            p_Cost: findProdData.p_Cost,
            p_Sale: findProdData.p_Sale,
            p_Discount: findProdData.p_Discount,
            p_Name: findProdData.p_Name,
            p_Option: findCartData[a].p_Option,
            p_Cnt: p_Cnt,
            p_Price: p_Price,
          };

          cartList.push(cartObj);
        }

        for (let c in cartList) {
          o_Price = o_Price + cartList[c].p_Price;
        }
      }

      return res.status(200).send({
        cartList,
        o_Price,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        success: false,
      });
    }
  },
  deleteCart: async (req, res) => {
    try {
      const { c_Type } = req.params;
      const { productList } = req.body;

      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      for (let i in productList) {
        await Cart.deleteOne({ u_Idx, c_Type, p_No: productList[i] });
      }

      const cartStatus = await Cart.find({ u_Idx, c_Type: 'c' }).count();
      return res.status(200).send({
        cartStatus,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        success: false,
      });
    }
  },
};

module.exports = cart;
