const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const OrderSchema = new Schema({
  o_No: { type: Number, required: true, unique: true },
  u_Idx: { type: Number, required: true },
  address: { type: Object, required: true },
  products: { type: Array, required: true },
  o_Price: { type: Number, required: true },
  o_BankBook: { type: String, default: null },
  o_Receipt: { type: Boolean, default: null },
  o_ReceiptNo: { type: String, default: null },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('Order', OrderSchema);
