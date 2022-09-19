const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const CartSchema = new Schema({
  u_Idx: { type: Number, required: true },
  cartList: { type: Array, required: true },
});

module.exports = mongoose.model('Cart', CartSchema);
