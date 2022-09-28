const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const AdminOrderSchema = new Schema({
  o_No: { type: Number, required: true },
  p_No: { type: Number, required: true },
  a_Idx: { type: Number, required: true },
  u_Idx: { type: Number, required: true },
  u_Id: { type: String, required: true },
  products: { type: Object, required: true },
  address: { type: Object, required: true },
  o_Date: { type: Date, required: true },
  o_Status: { type: String, required: true },
});

module.exports = mongoose.model('AdminOrder', AdminOrderSchema);
