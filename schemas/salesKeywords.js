const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const SalesKeywordSchema = new Schema({
  a_Idx: { type: Number, required: true },
  keyword: { type: String, required: true },
  p_No: { type: Number, required: true },
  k_Click: { type: Number, default: 0 },
  k_Cost: { type: Number, default: 0 },
  k_Trans: { type: Number, default: 0 },
  p_Price: { type: Number, default: 0 },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('SalesKeyword', SalesKeywordSchema);
