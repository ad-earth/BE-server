const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const CartSchema = new Schema({
  u_Idx: { type: Number, required: true },
  // cartList: { type: Array, required: true },
  c_Type: { type: String, required: true },
  p_No: { type: Number, required: true },
  p_Option: { type: Array, default: null },
  k_No: { type: Number, default: 0 },
});

module.exports = mongoose.model('Cart', CartSchema);
