const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const CancelProdSchema = new Schema({
  o_No: { type: Number, required: true, unique: true },
  u_Idx: { type: Number, required: true },
  products: { type: Array, required: true },
  o_Price: { type: Number, required: true },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('CancelProd', CancelProdSchema);
