const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const salesProductSchema = new Schema({
  a_Idx: { type: Number, required: true },
  p_No: { type: Number, required: true },
  p_Category: { type: String, required: true },
  p_Name: { type: String, required: true },
  p_Cnt: { type: Number, required: true },
  p_Price: { type: Number, required: true },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('salesProduct', salesProductSchema);
