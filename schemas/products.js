const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const ProductSchema = new Schema({
  p_No: { type: Number, required: true, unique: true },
  a_Idx: { type: Number, required: true },
  p_Category: { type: String, required: true },
  p_Thumbnail: { type: Array, required: true },
  a_Brand: { type: String, required: true },
  p_Name: { type: String, required: true },
  p_Cost: { type: Number, required: true },
  p_Sale: { type: Boolean, default: false },
  p_Discount: { type: Number, default: 0 },
  p_Option: { type: Array, default: null },
  p_Desc: { type: String, required: true },
  p_Content: { type: String },
  p_Soldout: { type: Boolean, default: false },
  p_New: { type: Boolean, default: true },
  p_Best: { type: Boolean, default: false },
  p_Price: { type: Number, default: 0 },
  p_Cnt: { type: Number, default: 0 },
  p_Status: { type: Boolean, default: true },
  p_Review: { type: Number, default: 0 },
  p_Like: { type: Number, default: 0 },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('Product', ProductSchema);
