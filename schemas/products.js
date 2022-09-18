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
  p_Sale: { type: Boolean, required: true },
  p_Discount: { type: Number, default: null },
  p_Option: { type: Array, default: null },
  p_Desc: { type: String, required: true },
  p_Soldout: { type: Boolean, required: true },
  p_New: { type: Boolean, required: true },
  p_Best: { type: Boolean, default: null },
  p_Price: { type: Number, default: null },
  p_Status: { type: Boolean, required: true },
  p_Review: { type: Number, default: null },
  p_Like: { type: Number, default: null },
  createdAt: { type: String, required: true },
});

module.exports = mongoose.model('Product', ProductSchema);
