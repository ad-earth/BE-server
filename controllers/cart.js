const Cart = require('../schemas/carts');

const cart = {
  createCartList: async (req, res) => {
    try {
      const { cartList } = req.body;

      // token
      const { user } = res.locals;
      const u_Idx = user.u_Idx;

      // cart에 기존 db 있는지 확인
      let db = await Cart.find({ u_Idx }).exec();

      // 장바구니 내역 있으면 삭제
      if (db != null) {
        await Cart.deleteOne({ u_Idx });
      }

      await Cart.create({ u_Idx, cartList });
      return res.status(201).send({
        success: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send({
        message: '잘못된 요청입니다.',
      });
    }
  },
};

module.exports = cart;
