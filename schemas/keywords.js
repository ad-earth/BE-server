const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const KeywordSchema = new Schema({
  k_No: { type: Number, required: true, unique: true },
  p_No: { type: Number, required: true },
  keyword: { type: String, required: true },
  k_Level: { type: Number, default: null },
  k_Cost: { type: Number, default: null },
  k_Click: { type: Number, default: null },
  k_Status: { type: String, required: true },
  createdAt: { type: String, required: true },
});

module.exports = mongoose.model('Keyword', KeywordSchema);
